import axios from 'axios';

export interface HuggingFaceResponse {
  generated_text: string;
}

export class HuggingFaceApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api-inference.huggingface.co/models';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGING_FACE_API_KEY || '';
  }

  async generateResponse(
    prompt: string, 
    model: string = 'google/gemma-2b-it',
    maxTokens: number = 512,
    temperature: number = 0.3
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature,
            return_full_text: false,
            do_sample: true,
          },
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

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].generated_text || response.data[0].text || '';
      }

      return response.data.generated_text || response.data.text || 'No response generated';
    } catch (error: any) {
      console.error('Hugging Face API error:', error.response?.data || error.message);
      
      // Fallback response for development
      if (!this.apiKey || this.apiKey === '') {
        return this.generateFallbackResponse(prompt);
      }
      
      throw new Error('Failed to generate response from Hugging Face API');
    }
  }

  private generateFallbackResponse(prompt: string): string {
    // Simple fallback for development when API key is not available
    if (prompt.toLowerCase().includes('computation') || prompt.toLowerCase().includes('calculate')) {
      return "I understand you're asking for computational analysis. Please provide your agricultural data and I'll help you calculate the statistics you need.";
    }
    
    if (prompt.toLowerCase().includes('crop') || prompt.toLowerCase().includes('farming')) {
      return "I'm here to help with agricultural questions. I can assist with crop information, farming practices, weather guidance, and data analysis. What specific agricultural topic would you like to know about?";
    }
    
    return "I'm an agricultural AI assistant. I can help you with farming questions, crop data analysis, weather information, and agricultural best practices. How can I assist you today?";
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      // Use a translation model
      const response = await axios.post(
        `${this.baseUrl}/Helsinki-NLP/opus-mt-en-${targetLanguage}`,
        {
          inputs: text,
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

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].translation_text || text;
      }

      return text; // Fallback to original text
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }
}

export const huggingFaceApi = new HuggingFaceApiService();
