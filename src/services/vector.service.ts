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
  metadata: Record<string, any>;
}

@Injectable()
export class VectorService {
  constructor(
    @InjectRepository(DocumentChunk)
    private chunkRepository: Repository<DocumentChunk>,
  ) {}

  /**
   * Salvar ou atualizar chunks com embeddings
   * Aceita chunks com embedding como number[] e converte para string format do PostgreSQL vector
   */
  async upsertVectors(
    chunks: Array<DocumentChunk & { embedding?: number[] | string }>,
  ): Promise<void> {
    if (chunks.length === 0) return;

    // Converter embeddings de number[] para string format do PostgreSQL vector
    const chunksToSave = chunks.map((chunk) => {
      const chunkCopy = { ...chunk };
      if (chunkCopy.embedding && Array.isArray(chunkCopy.embedding)) {
        chunkCopy.embedding = `[${chunkCopy.embedding.join(',')}]`;
      }
      return chunkCopy as DocumentChunk;
    });

    // Usar save para upsert (TypeORM faz INSERT ... ON CONFLICT automaticamente)
    await this.chunkRepository.save(chunksToSave);
  }

  /**
   * Buscar chunks similares usando busca vetorial
   */
  async search(queryVector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const topK = options.topK || 5;
    const minScore = options.minScore ?? 0.7;

    // Converter array para formato string do PostgreSQL vector
    const vectorString = `[${queryVector.join(',')}]`;

    // Construir query SQL nativa para busca vetorial
    // Usamos cosine distance (<=>) e convertemos para similarity (1 - distance)
    let query = `
      SELECT 
        dc.id,
        dc.content,
        dc.document_id as "documentId",
        dc.chunk_index as "chunkIndex",
        dc.metadata,
        1 - (dc.embedding <=> $1::vector) as similarity
      FROM document_chunks dc
      INNER JOIN documents d ON dc.document_id = d.id
      WHERE d.organization_id = $2
        AND dc.embedding IS NOT NULL
        AND (1 - (dc.embedding <=> $1::vector)) >= $3
    `;

    const params: any[] = [vectorString, options.organizationId, minScore];

    // Adicionar filtro por agent_id se fornecido
    if (options.agentId) {
      query += ` AND d.agent_id = $${params.length + 1}`;
      params.push(options.agentId);
    }

    query += `
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $${params.length + 1}
    `;
    params.push(topK);

    const results = await this.chunkRepository.query(query, params);

    return results.map((row: any) => ({
      id: row.id,
      content: row.content,
      documentId: row.documentId,
      chunkIndex: row.chunkIndex,
      similarity: Number.parseFloat(row.similarity),
      metadata: row.metadata || {},
    }));
  }

  /**
   * Remover chunks de um documento
   */
  async deleteByDocument(documentId: string): Promise<void> {
    await this.chunkRepository.delete({ documentId });
  }

  /**
   * Remover embeddings de chunks de um documento (mantém os chunks)
   */
  async clearEmbeddingsByDocument(documentId: string): Promise<void> {
    await this.chunkRepository
      .createQueryBuilder()
      .update(DocumentChunk)
      .set({ embedding: null })
      .where('document_id = :documentId', { documentId })
      .execute();
  }
}

