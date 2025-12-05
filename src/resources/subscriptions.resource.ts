import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../models/billing/subscription.entity';

@Injectable()
export class SubscriptionsResource {
  constructor(
    @InjectRepository(Subscription)
    private readonly repository: Repository<Subscription>,
  ) {}

  async findByOrganization(organizationId: string): Promise<Subscription | null> {
    return this.repository.findOne({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.repository.findOne({
      where: { stripeSubscriptionId },
    });
  }

  async findOne(id: string): Promise<Subscription | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<Subscription>): Promise<Subscription> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: Subscription): Promise<Subscription> {
    return this.repository.save(entity);
  }
}

