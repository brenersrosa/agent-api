import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrganization } from '../models/organizations/user-organization.entity';

@Injectable()
export class UserOrganizationResource {
  constructor(
    @InjectRepository(UserOrganization)
    private readonly repository: Repository<UserOrganization>,
  ) {}

  async findByUser(userId: string, relations?: string[]): Promise<UserOrganization[]> {
    return this.repository.find({
      where: { userId },
      relations,
    });
  }

  async findByOrganization(organizationId: string): Promise<UserOrganization[]> {
    return this.repository.find({
      where: { organizationId },
    });
  }

  async findOne(userId: string, organizationId: string): Promise<UserOrganization | null> {
    return this.repository.findOne({
      where: { userId, organizationId },
    });
  }

  async create(data: Partial<UserOrganization>): Promise<UserOrganization> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: UserOrganization): Promise<UserOrganization> {
    return this.repository.save(entity);
  }
}

