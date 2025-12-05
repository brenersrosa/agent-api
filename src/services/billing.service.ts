import { Injectable } from '@nestjs/common';
import { CreateCheckoutSessionDto } from '../dto/billing/create-checkout-session.dto';
import { StripeWebhookDto } from '../dto/billing/webhook.dto';

interface CreateCheckoutSessionParams extends CreateCheckoutSessionDto {
  organizationId: string;
}

@Injectable()
export class BillingService {
  async createCheckoutSession(dto: CreateCheckoutSessionParams) {
    return { sessionId: 'cs_xxx', url: 'https://checkout.stripe.com/...' };
  }

  async getSubscription(organizationId: string) {
    return { status: 'inactive', plan: 'free' };
  }

  async handleWebhook(body: StripeWebhookDto) {
    return { status: 'ok' };
  }
}
