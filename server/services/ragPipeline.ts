import { vectorSearchService } from './vectorSearch';
import { huggingFaceApi } from './huggingFaceApi';
import { dataProcessor } from './dataProcessor';
import { storage } from '../storage';

export interface RAGResponse {
  answer: string;
  sources: string[];
  isComputation: boolean;
  metadata?: any;
}

export class RAGPipelineService {
  async processQuery(
    query: string, 
    model: string = 'google/gemma-2b-it',
    language: string = 'english'
  ): Promise<RAGResponse> {
    try {
      // Check if this is a computational query
      const isComputation = dataProcessor.detectComputationalQuery(query);
      
      if (isComputation) {
        return await this.handleComputationalQuery(query);
      }
      
      // Regular RAG pipeline
      return await this.handleRAGQuery(query, model, language);
    } catch (error) {
      console.error('RAG Pipeline error:', error);
      throw new Error('Failed to process query');
    }
  }

  private async handleComputationalQuery(query: string): Promise<RAGResponse> {
    try {
      // Get all datasets and their data for computation
      const datasets = await storage.getAllDatasets();
      const csvDatasets = datasets.filter(d => d.fileType === 'csv' && d.status === 'ready');
      
      if (csvDatasets.length === 0) {
        return {
          answer: "No CSV datasets available for computation. Please upload agricultural data first.",
          sources: [],
          isComputation: true
        };
      }

      // Load actual CSV data from uploaded files
      const allCsvData: any[] = [];
      
      for (const dataset of csvDatasets) {
        try {
          const csvData = await this.loadCsvData(dataset.filePath);
          allCsvData.push(...csvData);
        } catch (error) {
          console.error(`Error loading CSV ${dataset.name}:`, error);
        }
      }
      
      if (allCsvData.length === 0) {
        return {
          answer: "Unable to load CSV data for computation. Please check your uploaded files.",
          sources: csvDatasets.map(d => d.name),
          isComputation: true
        };
      }
      
      const computationResult = await dataProcessor.performAgriculturalComputation(query, allCsvData);
      
      return {
        answer: computationResult,
        sources: csvDatasets.map(d => d.name),
        isComputation: true,
        metadata: {
          datasetCount: csvDatasets.length,
          computationType: 'agricultural_statistics',
          totalRows: allCsvData.length
        }
      };
    } catch (error) {
      console.error('Computational query error:', error);
      return {
        answer: "Error processing computational query. Please check your query format and try again.",
        sources: [],
        isComputation: true
      };
    }
  }

  private async handleRAGQuery(query: string, model: string, language: string): Promise<RAGResponse> {
    // Step 1: Retrieve relevant chunks using vector search
    const relevantChunks = await vectorSearchService.searchSimilarChunks(query, 5);
    
    if (relevantChunks.length === 0) {
      return {
        answer: "I don't have enough information in my knowledge base to answer that question. Please provide more context or upload relevant documents.",
        sources: [],
        isComputation: false
      };
    }
    
    // Step 2: Prepare context from retrieved chunks
    const context = relevantChunks
      .map(chunk => chunk.content)
      .join('\n\n');
    
    // Step 3: Create prompt for the LLM
    const prompt = this.createRAGPrompt(query, context, language);
    
    // Step 4: Generate response using Hugging Face API
    const response = await huggingFaceApi.generateResponse(prompt, model);
    
    // Step 5: Post-process response if needed
    const processedResponse = this.postProcessResponse(response);
    
    // Step 6: Extract sources
    const sources = relevantChunks
      .map(chunk => {
        const metadata = chunk.metadata as any;
        if (metadata?.fileName) {
          return metadata.fileName;
        }
        if (metadata?.type === 'csv_summary' || metadata?.type === 'csv_row') {
          return 'CSV Dataset';
        }
        return metadata?.type || 'Unknown source';
      })
      .filter((source, index, arr) => arr.indexOf(source) === index); // Remove duplicates
    
    return {
      answer: processedResponse,
      sources,
      isComputation: false,
      metadata: {
        chunksRetrieved: relevantChunks.length,
        model: model
      }
    };
  }

  private createRAGPrompt(query: string, context: string, language: string): string {
    const languageInstruction = language !== 'english' 
      ? `Please respond in ${language}. ` 
      : '';

    return `You are an expert agricultural assistant with access to agricultural datasets and research documents. 
${languageInstruction}Use the following context to answer the user's question clearly and accurately.

Context:
${context}

Question: ${query}

Instructions:
- Provide accurate, helpful information based on the context
- If the context doesn't contain enough information, say so clearly
- Focus on practical agricultural advice and data-driven insights
- Be concise but comprehensive
- If relevant, mention specific data points or statistics from the context

Answer:`;
  }

  private postProcessResponse(response: string): string {
    // Clean up the response
    let cleanedResponse = response.trim();
    
    // Remove any unwanted prefixes that might come from the model
    const unwantedPrefixes = ['Answer:', 'Response:', 'A:'];
    for (const prefix of unwantedPrefixes) {
      if (cleanedResponse.startsWith(prefix)) {
        cleanedResponse = cleanedResponse.substring(prefix.length).trim();
      }
    }
    
    return cleanedResponse;
  }

  private async loadCsvData(filePath: string): Promise<any[]> {
    const fs = await import('fs');
    const csvParser = await import('csv-parser');
    
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.default.createReadStream(filePath)
        .pipe(csvParser.default())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
}

export const ragPipelineService = new RAGPipelineService();
