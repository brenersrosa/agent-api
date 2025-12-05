import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../models/documents/document-chunk.entity';

@Injectable()
export class DocumentChunksResource {
  constructor(
    @InjectRepository(DocumentChunk)
    private readonly repository: Repository<DocumentChunk>,
  ) {}

  async findByDocument(documentId: string): Promise<DocumentChunk[]> {
    return this.repository.find({
      where: { documentId },
      order: { chunkIndex: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DocumentChunk | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<DocumentChunk>): Promise<DocumentChunk> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async createMany(data: Partial<DocumentChunk>[]): Promise<DocumentChunk[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async save(entity: DocumentChunk): Promise<DocumentChunk> {
    return this.repository.save(entity);
  }
}

