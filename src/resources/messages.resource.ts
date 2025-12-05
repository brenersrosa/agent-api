import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../models/whatsapp/message.entity';

@Injectable()
export class MessagesResource {
  constructor(
    @InjectRepository(Message)
    private readonly repository: Repository<Message>,
  ) {}

  async findByConversation(conversationId: string, order?: { createdAt: 'ASC' | 'DESC' }): Promise<Message[]> {
    return this.repository.find({
      where: { conversationId },
      order: order || { createdAt: 'ASC' },
    });
  }

  async findByWhatsAppMessageId(whatsappMessageId: string): Promise<Message | null> {
    return this.repository.findOne({
      where: { whatsappMessageId },
    });
  }

  async findOne(id: string): Promise<Message | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<Message>): Promise<Message> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: Message): Promise<Message> {
    return this.repository.save(entity);
  }
}

