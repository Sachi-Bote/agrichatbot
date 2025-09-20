import { Chunk } from "@shared/schema";
import { storage } from "../storage";
import { embeddingService } from "./embeddings";

export class VectorSearchService {
  async searchSimilarChunks(query: string, topK: number = 5): Promise<Chunk[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Search for similar chunks
      const similarChunks = await storage.searchChunksByEmbedding(queryEmbedding, topK);
      
      return similarChunks;
    } catch (error) {
      console.error('Error in vector search:', error);
      throw new Error('Vector search failed');
    }
  }

  async addChunkToIndex(content: string, datasetId: string, metadata?: any): Promise<Chunk> {
    try {
      // Generate embedding for the content
      const embedding = await embeddingService.generateEmbedding(content);
      
      // Create and store the chunk
      const chunk = await storage.createChunk({
        datasetId,
        content,
        embedding,
        metadata
      });
      
      return chunk;
    } catch (error) {
      console.error('Error adding chunk to index:', error);
      throw new Error('Failed to add chunk to index');
    }
  }

  async buildIndexForDataset(datasetId: string, chunks: Array<{content: string, metadata?: any}>): Promise<void> {
    try {
      // Extract content for embeddings
      const contents = chunks.map(chunk => chunk.content);
      const embeddings = await embeddingService.generateEmbeddings(contents);
      
      // Get dataset info for enhanced metadata
      const dataset = await storage.getDataset(datasetId);
      const fileName = dataset?.name || 'unknown';
      
      // Store all chunks with their embeddings and preserved metadata
      const chunkPromises = chunks.map((chunk, index) => 
        storage.createChunk({
          datasetId,
          content: chunk.content,
          embedding: embeddings[index],
          metadata: {
            ...chunk.metadata,
            fileName,
            datasetId,
            chunkIndex: index
          }
        })
      );
      
      await Promise.all(chunkPromises);
      
      // Update dataset status
      await storage.updateDatasetStatus(datasetId, 'ready');
    } catch (error) {
      console.error('Error building index for dataset:', error);
      await storage.updateDatasetStatus(datasetId, 'error');
      throw new Error('Failed to build index for dataset');
    }
  }
}

export const vectorSearchService = new VectorSearchService();
