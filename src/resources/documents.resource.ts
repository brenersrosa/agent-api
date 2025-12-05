import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../models/documents/document.entity';

@Injectable()
export class DocumentsResource {
  constructor(
    @InjectRepository(Document)
    private readonly repository: Repository<Document>,
  ) {}

  async findByOrganization(organizationId: string): Promise<Document[]> {
    return this.repository.find({
      where: { organizationId },
    });
  }

  async findOne(id: string, relations?: string[]): Promise<Document | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  async count(where: Partial<Document>): Promise<number> {
    return this.repository.count({
      where,
    });
  }

  async create(data: Partial<Document>): Promise<Document> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Document>): Promise<Document> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('Document not found');
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async save(entity: Document): Promise<Document> {
    return this.repository.save(entity);
  }

  async remove(entity: Document): Promise<void> {
    await this.repository.remove(entity);
  }
}

