import axios from 'axios';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class HuggingFaceEmbeddingService implements EmbeddingService {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'sentence-transformers/all-MiniLM-L6-v2') {
    this.apiKey = apiKey || process.env.HUGGING_FACE_API_KEY || '';
    this.modelName = modelName;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.modelName}`,
        {
          inputs: texts,
          options: {
            wait_for_model: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Handle both single text and batch responses
      if (Array.isArray(response.data[0])) {
        return response.data;
      } else {
        return [response.data];
      }
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }
}

// Fallback simple embedding service for development
export class SimpleEmbeddingService implements EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding for development
    const hash = this.simpleHash(text);
    const embedding = new Array(384).fill(0).map((_, i) => 
      Math.sin(hash + i) * 0.1
    );
    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

export const embeddingService = process.env.HUGGING_FACE_API_KEY 
  ? new HuggingFaceEmbeddingService()
  : new SimpleEmbeddingService();
