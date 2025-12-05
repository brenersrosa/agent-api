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
import { Document } from '../documents/document.entity';
import { Organization } from '../organizations/organization.entity';
import { Conversation } from '../whatsapp/conversation.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'system_prompt', type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ name: 'llm_model', default: 'gpt-4o' })
  llmModel: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature: number;

  @Column({ name: 'max_tokens', default: 1000 })
  maxTokens: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'whatsapp_phone_number', nullable: true })
  whatsappPhoneNumber: string;

  @OneToMany(
    () => Document,
    (document) => document.agent,
  )
  documents: Document[];

  @OneToMany(
    () => Conversation,
    (conversation) => conversation.agent,
  )
  conversations: Conversation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
