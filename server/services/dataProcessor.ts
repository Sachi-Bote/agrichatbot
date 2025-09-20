import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.warn('PDF parsing not available:', error);
  pdfParse = null;
}

export interface TextChunk {
  content: string;
  metadata?: any;
}

export class DataProcessor {
  async processFile(filePath: string, fileType: string): Promise<TextChunk[]> {
    switch (fileType.toLowerCase()) {
      case 'csv':
        return this.processCSV(filePath);
      case 'pdf':
        return this.processPDF(filePath);
      case 'txt':
        return this.processText(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async processCSV(filePath: string): Promise<TextChunk[]> {
    return new Promise((resolve, reject) => {
      const chunks: TextChunk[] = [];
      const rows: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          try {
            // Convert each row to text
            rows.forEach((row, index) => {
              const content = Object.entries(row)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
              
              chunks.push({
                content,
                metadata: { 
                  rowIndex: index, 
                  type: 'csv_row',
                  originalData: row
                }
              });
            });

            // Also create summary chunks for the entire dataset
            if (rows.length > 0) {
              const headers = Object.keys(rows[0]);
              const summaryContent = `CSV Dataset with columns: ${headers.join(', ')}. Total rows: ${rows.length}`;
              
              chunks.push({
                content: summaryContent,
                metadata: { 
                  type: 'csv_summary',
                  headers,
                  totalRows: rows.length
                }
              });
            }

            resolve(chunks);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async processPDF(filePath: string): Promise<TextChunk[]> {
    if (!pdfParse) {
      throw new Error('PDF parsing is not available in this environment');
    }
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return this.chunkText(pdfData.text, {
        type: 'pdf',
        totalPages: pdfData.numpages
      });
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error}`);
    }
  }

  private async processText(filePath: string): Promise<TextChunk[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.chunkText(content, { type: 'text' });
    } catch (error) {
      throw new Error(`Failed to process text file: ${error}`);
    }
  }

  private chunkText(text: string, metadata?: any, chunkSize: number = 1000, overlap: number = 200): TextChunk[] {
    const chunks: TextChunk[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;
      
      if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: { 
            ...metadata, 
            chunkIndex: chunks.length,
            length: currentChunk.length
          }
        });
        
        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + sentence;
        currentLength = overlapText.length + sentenceLength;
      } else {
        currentChunk += sentence + '. ';
        currentLength += sentenceLength;
      }
    }

    // Add the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { 
          ...metadata, 
          chunkIndex: chunks.length,
          length: currentChunk.length
        }
      });
    }

    return chunks;
  }

  // Agricultural computation detection and processing
  detectComputationalQuery(query: string): boolean {
    const computationKeywords = [
      'sum', 'total', 'average', 'mean', 'calculate', 'computation',
      'between', 'from', 'till', 'combined', 'aggregate', 'statistics'
    ];
    
    return computationKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  async performAgriculturalComputation(query: string, csvData: any[]): Promise<string> {
    try {
      // Extract crop and region information
      const crops = ['rice', 'wheat', 'maize', 'jowar', 'bajra', 'ragi', 'cotton', 'sugarcane'];
      const states = ['andhra pradesh', 'assam', 'kerala', 'manipur', 'maharashtra', 'madhya pradesh', 'punjab', 'tamil nadu', 'orissa', 'karnataka', 'gujarat'];
      
      const queryLower = query.toLowerCase();
      const crop = crops.find(c => queryLower.includes(c));
      const state = states.find(s => queryLower.includes(s));
      
      // Extract years
      const yearMatches = query.match(/\d{4}/g);
      const years = yearMatches ? yearMatches.map(y => parseInt(y)) : [];
      
      if (!crop) {
        return "Please specify a crop for computation (e.g., rice, wheat, maize).";
      }

      // Filter data based on crop and optionally state
      let filteredData = csvData.filter(row => {
        const rowText = Object.values(row).join(' ').toLowerCase();
        const hasCrop = rowText.includes(crop);
        const hasState = !state || rowText.includes(state);
        return hasCrop && hasState;
      });

      if (filteredData.length === 0) {
        return `No data found for ${crop}${state ? ` in ${state}` : ''}.`;
      }

      // Calculate statistics
      const values: number[] = [];
      
      filteredData.forEach(row => {
        Object.entries(row).forEach(([key, value]) => {
          // Check if key is a year or looks like a numeric column
          if (years.length === 0 || years.some(year => key.includes(year.toString()))) {
            const numValue = parseFloat(value as string);
            if (!isNaN(numValue)) {
              values.push(numValue);
            }
          }
        });
      });

      if (values.length === 0) {
        return "No numeric data found for computation.";
      }

      const total = values.reduce((sum, val) => sum + val, 0);
      const average = total / values.length;
      const yearRange = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : 'available years';
      const stateText = state ? ` in ${state.charAt(0).toUpperCase() + state.slice(1)}` : '';

      return `Computation Results for ${crop.charAt(0).toUpperCase() + crop.slice(1)}${stateText} (${yearRange}):\n` +
             `Total: ${total.toFixed(2)}\n` +
             `Average: ${average.toFixed(2)}\n` +
             `Data points: ${values.length}`;

    } catch (error) {
      console.error('Computation error:', error);
      return "Error performing computation. Please check your query and try again.";
    }
  }
}

export const dataProcessor = new DataProcessor();
