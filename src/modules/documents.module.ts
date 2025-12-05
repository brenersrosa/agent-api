import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModule } from './organizations.module';
import { DocumentsController } from '../controllers/documents.controller';
import { DocumentsService } from '../services/documents.service';
import { S3Service } from '../services/s3.service';
import { DocumentsResource } from '../resources/documents.resource';
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
  providers: [DocumentsService, S3Service, DocumentsResource],
  exports: [DocumentsService],
})
export class DocumentsModule {}
