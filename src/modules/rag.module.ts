import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from '../models/documents/document-chunk.entity';
import { RagController } from '../controllers/rag.controller';
import { RagService } from '../services/rag.service';
import { VectorService } from '../services/vector.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunk])],
  controllers: [RagController],
  providers: [RagService, VectorService],
  exports: [RagService, VectorService],
})
export class RagModule {}
