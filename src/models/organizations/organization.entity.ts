import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from '../agents/agent.entity';
import { Subscription } from '../billing/subscription.entity';
import { Document } from '../documents/document.entity';
import { Conversation } from '../whatsapp/conversation.entity';
import { UserOrganization } from './user-organization.entity';

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'api_key_hash', unique: true, nullable: true })
  apiKeyHash: string;

  @Column({
    name: 'subscription_tier',
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Column({
    name: 'subscription_status',
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'max_documents', default: 10 })
  maxDocuments: number;

  @Column({ name: 'max_agents', default: 1 })
  maxAgents: number;

  @Column({ name: 'max_monthly_messages', default: 100 })
  maxMonthlyMessages: number;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @OneToMany(
    () => UserOrganization,
    (userOrg) => userOrg.organization,
  )
  users: UserOrganization[];

  @OneToMany(
    () => Agent,
    (agent) => agent.organization,
  )
  agents: Agent[];

  @OneToMany(
    () => Document,
    (document) => document.organization,
  )
  documents: Document[];

  @OneToMany(
    () => Conversation,
    (conversation) => conversation.organization,
  )
  conversations: Conversation[];

  @OneToMany(
    () => Subscription,
    (subscription) => subscription.organization,
  )
  subscriptions: Subscription[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
