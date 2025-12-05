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
import { Message } from './message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

@Entity('conversations')
export class Conversation {
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

  @Column({ name: 'whatsapp_phone_number' })
  whatsappPhoneNumber: string;

  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'last_message_at', nullable: true })
  lastMessageAt: Date;

  @OneToMany(
    () => Message,
    (message) => message.conversation,
  )
  messages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
