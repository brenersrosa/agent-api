import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../models/organizations/organization.entity';

@Injectable()
export class OrganizationsResource {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async findOne(id: string, relations?: string[]): Promise<Organization | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { slug },
    });
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('Organization not found');
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async save(entity: Organization): Promise<Organization> {
    return this.repository.save(entity);
  }
}

