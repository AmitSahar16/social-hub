export class EmbeddingService {
  private model: string = 'gemini-embedding-001';

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      console.warn('No API key configured, returning zero vector');
      return new Array(3072).fill(0);
    }

    try {
      const cleanText = text.trim().substring(0, 10000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              parts: [{ text: cleanText }]
            }
          })
        }
      );

      if (response.status === 429) {
        console.log('Embedding API rate limit hit (429)');
        return new Array(3072).fill(0);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Embedding API Error: ${response.status}`, errorText);
        throw new Error(`Embedding generation failed: ${response.status}`);
      }

      const data = await response.json();
      const embedding = data.embedding?.values;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response format');
      }

      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return new Array(3072).fill(0);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
      await this.delay(100);
    }

    return embeddings;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }
}

export const embeddingService = new EmbeddingService();
