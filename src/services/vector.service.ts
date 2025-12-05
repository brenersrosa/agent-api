import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../models/documents/document-chunk.entity';

export interface VectorSearchOptions {
  organizationId: string;
  agentId?: string;
  topK?: number;
  minScore?: number;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  documentId: string;
  chunkIndex: number;
  similarity: number;
  metadata: Record<string, unknown>;
}

interface VectorSearchRow {
  id: string;
  content: string;
  documentId: string;
  chunkIndex: number;
  similarity: string | number;
  metadata: Record<string, unknown> | null;
}

@Injectable()
export class VectorService {
  constructor(
    @InjectRepository(DocumentChunk)
    private chunkRepository: Repository<DocumentChunk>,
  ) {}

  async upsertVectors(
    chunks: Array<Partial<DocumentChunk> & { embedding?: number[] | string }>,
  ): Promise<void> {
    if (chunks.length === 0) return;

    const chunksToSave = chunks.map((chunk) => {
      const chunkCopy: Partial<DocumentChunk> = { ...chunk };
      if (chunkCopy.embedding && Array.isArray(chunkCopy.embedding)) {
        chunkCopy.embedding = `[${chunkCopy.embedding.join(',')}]`;
      }
      return chunkCopy;
    });

    // Usa create e save para garantir que os chunks sejam criados corretamente
    const entities = this.chunkRepository.create(chunksToSave);
    await this.chunkRepository.save(entities);
  }

  async search(queryVector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const topK = options.topK || 5;
    const minScore = options.minScore ?? 0.7;

    const vectorString = `[${queryVector.join(',')}]`;

    // Usa CAST para garantir que o embedding seja tratado como vector
    // Isso funciona mesmo se a coluna estiver como text no banco
    let query = `
      SELECT 
        dc.id,
        dc.content,
        dc.document_id as "documentId",
        dc.chunk_index as "chunkIndex",
        dc.metadata,
        1 - (CAST(dc.embedding AS vector) <=> $1::vector) as similarity
      FROM document_chunks dc
      INNER JOIN documents d ON dc.document_id = d.id
      WHERE d.organization_id = $2
        AND dc.embedding IS NOT NULL
        AND (1 - (CAST(dc.embedding AS vector) <=> $1::vector)) >= $3
    `;

    const params: (string | number)[] = [vectorString, options.organizationId, minScore];

    if (options.agentId) {
      query += ` AND d.agent_id = $${params.length + 1}`;
      params.push(options.agentId);
    }

    query += `
      ORDER BY CAST(dc.embedding AS vector) <=> $1::vector
      LIMIT $${params.length + 1}
    `;
    params.push(topK);

    const results = await this.chunkRepository.query(query, params);

    return (results as VectorSearchRow[]).map((row) => ({
      id: row.id,
      content: row.content,
      documentId: row.documentId,
      chunkIndex: row.chunkIndex,
      similarity: Number.parseFloat(String(row.similarity)),
      metadata: (row.metadata as Record<string, unknown>) || {},
    }));
  }

  async deleteByDocument(documentId: string): Promise<void> {
    await this.chunkRepository.delete({ documentId });
  }

  async clearEmbeddingsByDocument(documentId: string): Promise<void> {
    await this.chunkRepository
      .createQueryBuilder()
      .update(DocumentChunk)
      .set({ embedding: null })
      .where('document_id = :documentId', { documentId })
      .execute();
  }
}
