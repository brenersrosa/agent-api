import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../organizations/organization.entity';

export enum InvoiceStatus {
  PAID = 'paid',
  OPEN = 'open',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'stripe_invoice_id', unique: true })
  stripeInvoiceId: string;

  @Column()
  amount: number; // em centavos

  @Column({ default: 'BRL' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
  })
  status: InvoiceStatus;

  @Column({ name: 'invoice_pdf_url', nullable: true })
  invoicePdfUrl: string;

  @Column({ name: 'hosted_invoice_url', nullable: true })
  hostedInvoiceUrl: string;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
