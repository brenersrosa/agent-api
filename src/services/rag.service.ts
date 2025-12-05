import { Injectable } from '@nestjs/common';
import { QueryDto } from '../dto/rag/query.dto';
import { VectorSearchOptions, VectorService } from './vector.service';

interface RagQueryDto extends QueryDto {
  organizationId: string;
  queryEmbedding?: number[];
}

@Injectable()
export class RagService {
  constructor(private readonly vectorService: VectorService) {}

  async query(dto: RagQueryDto) {
    const searchOptions: VectorSearchOptions = {
      organizationId: dto.organizationId,
      agentId: dto.agentId,
      topK: dto.maxResults || 5,
      minScore: 0.7,
    };

    if (dto.query && dto.queryEmbedding) {
      const results = await this.vectorService.search(dto.queryEmbedding, searchOptions);

      return {
        answer: 'RAG service not fully implemented yet',
        sources: results.map((r) => ({
          documentId: r.documentId,
          chunkIndex: r.chunkIndex,
          content: r.content.substring(0, 200),
          similarity: r.similarity,
        })),
        queryId: null,
        processingTimeMs: 0,
        model: 'gpt-4o',
        tokensUsed: 0,
      };
    }

    return {
      answer: 'RAG service not implemented yet',
      sources: [],
      queryId: null,
      processingTimeMs: 0,
      model: 'gpt-4o',
      tokensUsed: 0,
    };
  }
}
