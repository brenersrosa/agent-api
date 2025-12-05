import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from '../models/webhooks/webhook-event.entity';

@Injectable()
export class WebhookEventsResource {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly repository: Repository<WebhookEvent>,
  ) {}

  async findByEventId(eventId: string): Promise<WebhookEvent | null> {
    return this.repository.findOne({
      where: { eventId },
    });
  }

  async findUnprocessed(): Promise<WebhookEvent[]> {
    return this.repository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<WebhookEvent | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<WebhookEvent>): Promise<WebhookEvent> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: WebhookEvent): Promise<WebhookEvent> {
    return this.repository.save(entity);
  }
}

