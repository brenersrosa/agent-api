import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../models/whatsapp/conversation.entity';

@Injectable()
export class ConversationsResource {
  constructor(
    @InjectRepository(Conversation)
    private readonly repository: Repository<Conversation>,
  ) {}

  async findByOrganization(organizationId: string, relations?: string[]): Promise<Conversation[]> {
    return this.repository.find({
      where: { organizationId },
      relations,
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findByPhone(organizationId: string, phone: string): Promise<Conversation | null> {
    return this.repository.findOne({
      where: {
        organizationId,
        whatsappPhoneNumber: phone,
      },
    });
  }

  async findOne(id: string, relations?: string[]): Promise<Conversation | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  async findOneByPhone(phone: string): Promise<Conversation | null> {
    return this.repository.findOne({
      where: { whatsappPhoneNumber: phone },
      order: { lastMessageAt: 'DESC' },
    });
  }

  async create(data: Partial<Conversation>): Promise<Conversation> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: Conversation): Promise<Conversation> {
    return this.repository.save(entity);
  }
}

