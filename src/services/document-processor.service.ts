import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from '../models/documents/document.entity';
import { DocumentChunk } from '../models/documents/document-chunk.entity';
import { TextExtractionService } from './text-extraction.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingsService } from './embeddings.service';
import { VectorService } from './vector.service';
import { S3Service } from './s3.service';
import { DocumentsResource } from '../resources/documents.resource';
import { DocumentChunksResource } from '../resources/document-chunks.resource';

@Processor('document.process')
@Injectable()
export class DocumentProcessorService extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private documentsResource: DocumentsResource,
    private documentChunksResource: DocumentChunksResource,
    private textExtractionService: TextExtractionService,
    private chunkingService: ChunkingService,
    private embeddingsService: EmbeddingsService,
    private vectorService: VectorService,
    private s3Service: S3Service,
  ) {
    super();
  }

  async process(job: Job<{ documentId: string }>): Promise<void> {
    const { documentId } = job.data;
    this.logger.log(`Processing document ${documentId}`);

    const document = await this.documentsResource.findOne(documentId);

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    try {
      // 1. Limpar chunks antigos se existirem (para reprocessamento)
      const existingChunks = await this.documentChunksResource.findByDocument(documentId);
      if (existingChunks.length > 0) {
        this.logger.log(`Removing ${existingChunks.length} old chunks for document ${documentId}`);
        await this.vectorService.deleteByDocument(documentId);
      }

      // 2. Atualizar status para processing
      await this.documentsResource.update(documentId, {
        status: DocumentStatus.PROCESSING,
      });

      // 3. Download do S3
      this.logger.log(`Downloading document from S3: ${document.s3Key}`);
      const fileBuffer = await this.s3Service.getObject(document.s3Bucket, document.s3Key);

      // 4. Extrair texto baseado no tipo
      this.logger.log(`Extracting text from ${document.fileType} file`);
      const { text, metadata: extractionMetadata } = await this.textExtractionService.extract(
        document.fileType,
        fileBuffer,
      );

      if (!text || text.trim().length === 0) {
        throw new Error('Nenhum texto foi extraído do documento');
      }

      // 5. Normalizar texto
      const normalizedText = this.normalizeText(text);

      // 6. Atualizar metadata do documento
      const updatedMetadata = {
        ...document.metadata,
        ...extractionMetadata,
        extractedAt: new Date().toISOString(),
        textLength: normalizedText.length,
      };
      await this.documentsResource.update(documentId, { metadata: updatedMetadata });

      // 7. Chunking
      this.logger.log(`Creating chunks for document ${documentId}`);
      const chunksData = await this.chunkingService.createChunks(
        normalizedText,
        documentId,
        extractionMetadata,
      );

      if (chunksData.length === 0) {
        throw new Error('Nenhum chunk foi criado do documento');
      }

      // 8. Gerar embeddings em batch
      this.logger.log(`Generating embeddings for ${chunksData.length} chunks`);
      const embeddings = await this.embeddingsService.generateBatchEmbeddings(
        chunksData.map((chunk) => chunk.content),
      );

      if (embeddings.length !== chunksData.length) {
        throw new Error(`Número de embeddings (${embeddings.length}) não corresponde ao número de chunks (${chunksData.length})`);
      }

      // 9. Associar embeddings aos chunks e salvar tudo de uma vez
      const chunksWithEmbeddings = chunksData.map((chunk, index) => ({
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        pageNumber: chunk.pageNumber,
        metadata: chunk.metadata,
        embedding: embeddings[index],
      })) as Array<Partial<DocumentChunk> & { embedding?: number[] | string }>;

      this.logger.log(`Saving ${chunksWithEmbeddings.length} chunks with embeddings to database`);
      await this.vectorService.upsertVectors(chunksWithEmbeddings);

      // 10. Atualizar documento com status processed
      await this.documentsResource.update(documentId, {
        status: DocumentStatus.PROCESSED,
        chunkCount: chunksData.length,
        processedAt: new Date(),
      });

      this.logger.log(`Document ${documentId} processed successfully with ${chunksData.length} chunks`);
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}: ${error.message}`, error.stack);

      // Atualizar status para failed
      await this.documentsResource.update(documentId, {
        status: DocumentStatus.FAILED,
        processingError: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw error;
    }
  }

  /**
   * Normaliza o texto extraído
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normaliza quebras de linha
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Remove múltiplas quebras de linha
      .replace(/[ \t]+/g, ' ') // Normaliza espaços
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
      .trim();
  }
}

