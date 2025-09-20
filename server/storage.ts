import { type User, type InsertUser, type Dataset, type InsertDataset, type Chunk, type InsertChunk, type Conversation, type InsertConversation, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Dataset operations
  getDataset(id: string): Promise<Dataset | undefined>;
  getAllDatasets(): Promise<Dataset[]>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  updateDatasetStatus(id: string, status: string): Promise<void>;

  // Chunk operations
  getChunk(id: string): Promise<Chunk | undefined>;
  getChunksByDataset(datasetId: string): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  searchChunksByEmbedding(embedding: number[], limit?: number): Promise<Chunk[]>;

  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;

  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private datasets: Map<string, Dataset>;
  private chunks: Map<string, Chunk>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.datasets = new Map();
    this.chunks = new Map();
    this.conversations = new Map();
    this.messages = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Dataset operations
  async getDataset(id: string): Promise<Dataset | undefined> {
    return this.datasets.get(id);
  }

  async getAllDatasets(): Promise<Dataset[]> {
    return Array.from(this.datasets.values());
  }

  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const id = randomUUID();
    const dataset: Dataset = { 
      ...insertDataset, 
      id, 
      status: "processing",
      createdAt: new Date(),
      description: insertDataset.description || null
    };
    this.datasets.set(id, dataset);
    return dataset;
  }

  async updateDatasetStatus(id: string, status: string): Promise<void> {
    const dataset = this.datasets.get(id);
    if (dataset) {
      dataset.status = status;
      this.datasets.set(id, dataset);
    }
  }

  // Chunk operations
  async getChunk(id: string): Promise<Chunk | undefined> {
    return this.chunks.get(id);
  }

  async getChunksByDataset(datasetId: string): Promise<Chunk[]> {
    return Array.from(this.chunks.values()).filter(
      chunk => chunk.datasetId === datasetId
    );
  }

  async createChunk(insertChunk: InsertChunk): Promise<Chunk> {
    const id = randomUUID();
    const chunk: Chunk = { 
      ...insertChunk, 
      id,
      createdAt: new Date(),
      metadata: insertChunk.metadata || null,
      datasetId: insertChunk.datasetId || null,
      embedding: insertChunk.embedding || null
    };
    this.chunks.set(id, chunk);
    return chunk;
  }

  async searchChunksByEmbedding(embedding: number[], limit: number = 5): Promise<Chunk[]> {
    // Simple cosine similarity search
    const chunksWithScores = Array.from(this.chunks.values())
      .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
      .map(chunk => ({
        chunk,
        score: this.cosineSimilarity(embedding, chunk.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return chunksWithScores.map(item => item.chunk);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Conversation operations
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = { 
      ...insertConversation, 
      id,
      createdAt: new Date(),
      title: insertConversation.title || null
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  // Message operations
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id,
      createdAt: new Date(),
      metadata: insertMessage.metadata || null,
      conversationId: insertMessage.conversationId || null
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
