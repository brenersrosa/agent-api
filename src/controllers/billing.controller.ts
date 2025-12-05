import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { BillingService } from '../services/billing.service';
import { CreateCheckoutSessionDto } from '../dto/billing/create-checkout-session.dto';
import { StripeWebhookDto } from '../dto/billing/webhook.dto';
import { Subscription } from '../models/billing/subscription.entity';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessão de checkout do Stripe' })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Sessão de checkout criada com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.billingService.createCheckoutSession({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter assinatura da organização' })
  @ApiResponse({
    status: 200,
    description: 'Assinatura retornada com sucesso',
    type: Subscription,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getSubscription(@Request() req: AuthenticatedRequest) {
    return this.billingService.getSubscription(req.user.organizationId);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook do Stripe (público)' })
  @ApiBody({
    description: 'Dados do webhook do Stripe',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  async webhook(@Body() body: StripeWebhookDto) {
    return this.billingService.handleWebhook(body);
  }
}
