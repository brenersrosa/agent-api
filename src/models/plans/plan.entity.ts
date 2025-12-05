import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'stripe_price_id', unique: true, nullable: true })
  stripePriceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({
    name: 'billing_interval',
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  @Column({ name: 'max_documents' })
  maxDocuments: number;

  @Column({ name: 'max_agents' })
  maxAgents: number;

  @Column({ name: 'max_monthly_messages' })
  maxMonthlyMessages: number;

  @Column({ type: 'jsonb', default: '{}' })
  features: Record<string, any>;

  @Column({ name: 'trial_days', nullable: true })
  trialDays: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

