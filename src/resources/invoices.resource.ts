import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../models/billing/invoice.entity';

@Injectable()
export class InvoicesResource {
  constructor(
    @InjectRepository(Invoice)
    private readonly repository: Repository<Invoice>,
  ) {}

  async findByOrganization(organizationId: string): Promise<Invoice[]> {
    return this.repository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStripeInvoiceId(stripeInvoiceId: string): Promise<Invoice | null> {
    return this.repository.findOne({
      where: { stripeInvoiceId },
    });
  }

  async findOne(id: string): Promise<Invoice | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(data: Partial<Invoice>): Promise<Invoice> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: Invoice): Promise<Invoice> {
    return this.repository.save(entity);
  }
}

