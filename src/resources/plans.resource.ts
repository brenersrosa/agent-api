import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../models/plans/plan.entity';

@Injectable()
export class PlansResource {
  constructor(
    @InjectRepository(Plan)
    private readonly repository: Repository<Plan>,
  ) {}

  async findAll(order?: { createdAt: 'DESC' }): Promise<Plan[]> {
    return this.repository.find({
      order: order || { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Plan | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Plan | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async findByStripePriceId(stripePriceId: string): Promise<Plan | null> {
    return this.repository.findOne({
      where: { stripePriceId },
    });
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('Plan not found');
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async remove(entity: Plan): Promise<void> {
    await this.repository.remove(entity);
  }
}

