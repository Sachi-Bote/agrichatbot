import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { ragPipelineService } from "./services/ragPipeline";
import { dataProcessor } from "./services/dataProcessor";
import { vectorSearchService } from "./services/vectorSearch";
import { insertDatasetSchema, insertConversationSchema, insertMessageSchema, querySchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.pdf', '.txt', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: CSV, PDF, TXT, JPG, PNG'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint - main RAG pipeline
  app.post("/api/chat", async (req, res) => {
    try {
      const validatedData = querySchema.parse(req.body);
      
      // Create or get conversation
      let conversationId = validatedData.conversationId;
      if (!conversationId) {
        const conversation = await storage.createConversation({
          title: validatedData.message.substring(0, 50) + "..."
        });
        conversationId = conversation.id;
      }

      // Save user message
      await storage.createMessage({
        conversationId,
        role: "user",
        content: validatedData.message
      });

      // Process query through RAG pipeline
      const ragResponse = await ragPipelineService.processQuery(
        validatedData.message,
        validatedData.model,
        validatedData.language
      );

      // Save assistant message
      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: ragResponse.answer,
        metadata: {
          sources: ragResponse.sources,
          isComputation: ragResponse.isComputation,
          ...ragResponse.metadata
        }
      });

      res.json({
        conversationId,
        answer: ragResponse.answer,
        sources: ragResponse.sources,
        isComputation: ragResponse.isComputation,
        metadata: ragResponse.metadata
      });

    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to process chat message',
        details: error.message 
      });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const results = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          const fileType = path.extname(file.originalname).substring(1);
          
          // Create dataset record
          const dataset = await storage.createDataset({
            name: file.originalname,
            description: `Uploaded ${fileType.toUpperCase()} file`,
            fileType,
            filePath: file.path
          });

          // Process file and build index
          const chunks = await dataProcessor.processFile(file.path, fileType);
          await vectorSearchService.buildIndexForDataset(
            dataset.id, 
            chunks
          );

          results.push({
            id: dataset.id,
            name: dataset.name,
            status: 'ready',
            chunksCreated: chunks.length
          });

        } catch (error: any) {
          console.error(`Error processing file ${file.originalname}:`, error);
          results.push({
            name: file.originalname,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({ results });

    } catch (error: any) {
      console.error('Upload endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to process upload',
        details: error.message 
      });
    }
  });

  // Get datasets
  app.get("/api/datasets", async (req, res) => {
    try {
      const datasets = await storage.getAllDatasets();
      res.json(datasets);
    } catch (error: any) {
      console.error('Datasets endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch datasets',
        details: error.message 
      });
    }
  });

  // Get conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error: any) {
      console.error('Conversations endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch conversations',
        details: error.message 
      });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error: any) {
      console.error('Messages endpoint error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        details: error.message 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        vectorSearch: 'ready',
        ragPipeline: 'ready',
        dataProcessor: 'ready'
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
