import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from '../controllers/billing.controller';
import { BillingService } from '../services/billing.service';
import { InvoicesResource } from '../resources/invoices.resource';
import { SubscriptionsResource } from '../resources/subscriptions.resource';
import { Invoice } from '../models/billing/invoice.entity';
import { Subscription } from '../models/billing/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Invoice])],
  controllers: [BillingController],
  providers: [BillingService, InvoicesResource, SubscriptionsResource],
  exports: [BillingService],
})
export class BillingModule {}
