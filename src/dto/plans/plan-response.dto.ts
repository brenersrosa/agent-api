import { ApiProperty } from '@nestjs/swagger';
import { BillingInterval } from '../../models/plans/plan.entity';

export class PlanResponseDto {
  @ApiProperty({ description: 'ID do plano' })
  id: string;

  @ApiProperty({ description: 'Nome do plano' })
  name: string;

  @ApiProperty({ required: false, description: 'Descrição do plano' })
  description?: string;

  @ApiProperty({
    required: false,
    description: 'ID do preço no Stripe',
  })
  stripePriceId?: string;

  @ApiProperty({ description: 'Preço do plano' })
  price: number;

  @ApiProperty({ description: 'Moeda do plano' })
  currency: string;

  @ApiProperty({
    description: 'Intervalo de cobrança',
    enum: BillingInterval,
  })
  billingInterval: BillingInterval;

  @ApiProperty({ description: 'Número máximo de documentos' })
  maxDocuments: number;

  @ApiProperty({ description: 'Número máximo de agentes' })
  maxAgents: number;

  @ApiProperty({ description: 'Número máximo de mensagens mensais' })
  maxMonthlyMessages: number;

  @ApiProperty({
    description: 'Features extras do plano',
    type: 'object',
  })
  features: Record<string, any>;

  @ApiProperty({
    required: false,
    description: 'Dias de trial',
  })
  trialDays?: number;

  @ApiProperty({ description: 'Se o plano está ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

