import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsPositive,
  Min,
} from 'class-validator';
import { BillingInterval } from '../../models/plans/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ description: 'Nome do plano (único)' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Descrição do plano' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'ID do preço no Stripe',
  })
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiProperty({ description: 'Preço do plano' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Moeda do plano',
    default: 'BRL',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Intervalo de cobrança',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  @IsEnum(BillingInterval)
  @IsOptional()
  billingInterval?: BillingInterval;

  @ApiProperty({ description: 'Número máximo de documentos' })
  @IsNumber()
  @Min(0)
  maxDocuments: number;

  @ApiProperty({ description: 'Número máximo de agentes' })
  @IsNumber()
  @Min(0)
  maxAgents: number;

  @ApiProperty({ description: 'Número máximo de mensagens mensais' })
  @IsNumber()
  @Min(0)
  maxMonthlyMessages: number;

  @ApiProperty({
    required: false,
    description: 'Features extras do plano (JSON)',
    default: {},
  })
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  @ApiProperty({
    required: false,
    description: 'Dias de trial',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiProperty({
    description: 'Se o plano está ativo',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

