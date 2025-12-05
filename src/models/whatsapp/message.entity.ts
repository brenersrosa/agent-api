import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({
    type: 'enum',
    enum: MessageDirection,
  })
  direction: MessageDirection;

  @Column({ name: 'whatsapp_message_id', unique: true, nullable: true })
  whatsappMessageId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl: string;

  @Column({ name: 'is_from_rag', default: false })
  isFromRag: boolean;

  @Column({ name: 'rag_sources', type: 'jsonb', nullable: true })
  ragSources: Array<{
    documentId: string;
    chunkId: string;
    score: number;
  }>;

  @Column({ name: 'processing_time_ms', nullable: true })
  processingTimeMs: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
