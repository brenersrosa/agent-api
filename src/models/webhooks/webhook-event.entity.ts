import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum WebhookSource {
  STRIPE = 'stripe',
  WHATSAPP = 'whatsapp',
}

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: WebhookSource,
  })
  source: WebhookSource;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'event_id', unique: true, nullable: true })
  eventId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;
}
