import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  async createCheckoutSession(dto: any) {
    // TODO: Implementar criação de checkout session
    return { sessionId: 'cs_xxx', url: 'https://checkout.stripe.com/...' };
  }

  async getSubscription(organizationId: string) {
    // TODO: Implementar busca de assinatura
    return { status: 'inactive', plan: 'free' };
  }

  async handleWebhook(body: any) {
    // TODO: Implementar webhook handler
    return { status: 'ok' };
  }
}

