import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModule } from './organizations.module';
import { DocumentsController } from '../controllers/documents.controller';
import { DocumentsService } from '../services/documents.service';
import { UploadProgressService } from '../services/upload-progress.service';
import { DocumentsResource } from '../resources/documents.resource';
import { DocumentChunksResource } from '../resources/document-chunks.resource';
import { DocumentProcessorService } from '../services/document-processor.service';
import { TextExtractionService } from '../services/text-extraction.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingsService } from '../services/embeddings.service';
import { VectorService } from '../services/vector.service';
import { DocumentChunk } from '../models/documents/document-chunk.entity';
import { Document } from '../models/documents/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentChunk]),
    BullModule.registerQueue({
      name: 'document.process',
    }),
    OrganizationsModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    UploadProgressService,
    DocumentsResource,
    DocumentChunksResource,
    DocumentProcessorService,
    TextExtractionService,
    ChunkingService,
    EmbeddingsService,
    VectorService,
  ],
  exports: [DocumentsService, EmbeddingsService, VectorService, DocumentsResource],
})
export class DocumentsModule {}
