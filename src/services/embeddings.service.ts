import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly batchSize: number = 100;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY não configurada. Embeddings não funcionarão.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });

    this.model = this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-large';
  }

  /**
   * Gera embeddings para um array de textos em batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (!this.configService.get<string>('OPENAI_API_KEY')) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const embeddings: number[][] = [];

    // Processa em batches para respeitar limites da API
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      this.logger.log(`Generating embeddings for batch ${Math.floor(i / this.batchSize) + 1} (${batch.length} texts)`);

      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
        });

        const batchEmbeddings = response.data.map((item) => item.embedding);
        embeddings.push(...batchEmbeddings);

        // Pequeno delay para respeitar rate limits
        if (i + this.batchSize < texts.length) {
          await this.delay(100); // 100ms entre batches
        }
      } catch (error) {
        this.logger.error(`Error generating embeddings for batch: ${error.message}`, error.stack);
        throw new Error(`Falha ao gerar embeddings: ${error.message}`);
      }
    }

    this.logger.log(`Generated ${embeddings.length} embeddings`);
    return embeddings;
  }

  /**
   * Gera embedding para um único texto
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateBatchEmbeddings([text]);
    return embeddings[0];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

