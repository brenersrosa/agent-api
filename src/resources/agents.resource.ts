import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../models/agents/agent.entity';

@Injectable()
export class AgentsResource {
  constructor(
    @InjectRepository(Agent)
    private readonly repository: Repository<Agent>,
  ) {}

  async findByOrganization(organizationId: string): Promise<Agent[]> {
    return this.repository.find({
      where: { organizationId },
    });
  }

  async findOne(id: string): Promise<Agent | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<Agent>): Promise<Agent> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Agent>): Promise<Agent> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('Agent not found');
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

