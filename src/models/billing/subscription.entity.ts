import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../organizations/organization.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'stripe_subscription_id', unique: true })
  stripeSubscriptionId: string;

  @Column({ name: 'stripe_customer_id' })
  stripeCustomerId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({ name: 'current_period_start' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'canceled_at', nullable: true })
  canceledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
