import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from '../agents/agent.entity';
import { Organization } from '../organizations/organization.entity';
import { DocumentChunk } from './document-chunk.entity';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @ManyToOne(() => Agent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column()
  filename: string;

  @Column({ name: 'original_filename' })
  originalFilename: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 's3_bucket' })
  s3Bucket: string;

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError: string;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount: number;

  @Column({ default: 1 })
  version: number;

  @OneToMany(
    () => DocumentChunk,
    (chunk) => chunk.document,
  )
  chunks: DocumentChunk[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;
}
