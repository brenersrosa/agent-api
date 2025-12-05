import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AgentsResource } from '../resources/agents.resource';
import { Agent } from '../models/agents/agent.entity';

@Injectable()
export class AgentsService {
  constructor(private readonly agentsResource: AgentsResource) {}

  async findByOrganization(organizationId: string): Promise<Agent[]> {
    return this.agentsResource.findByOrganization(organizationId);
  }

  async create(organizationId: string, createDto: Partial<Agent>): Promise<Agent> {
    return this.agentsResource.create({
      ...createDto,
      organizationId,
    });
  }

  async update(id: string, updateDto: Partial<Agent>): Promise<Agent> {
    return this.agentsResource.update(id, updateDto);
  }

  async remove(id: string): Promise<void> {
    await this.agentsResource.remove(id);
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentsResource.findOne(id);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async findOneWithOrganization(id: string, organizationId: string): Promise<Agent> {
    const agent = await this.findOne(id);

    if (agent.organizationId !== organizationId) {
      throw new ForbiddenException('Agent does not belong to your organization');
    }

    return agent;
  }

  async updateAvatarUrl(id: string, avatarUrl: string | null): Promise<Agent> {
    return this.agentsResource.update(id, { avatarUrl });
  }
}

