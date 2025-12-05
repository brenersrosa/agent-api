import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('document_chunks')
@Unique(['documentId', 'chunkIndex'])
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id' })
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'chunk_index' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'token_count', nullable: true })
  tokenCount: number;

  @Column({ name: 'page_number', nullable: true })
  pageNumber: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Embedding vector from OpenAI (text-embedding-3-large) stored as vector type in DB',
  })
  embedding?: string; // Stored as vector in DB, but TypeORM treats it as text

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
