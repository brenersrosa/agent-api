import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'ID do preço do Stripe' })
  @IsString()
  priceId: string;

  @ApiProperty({
    required: false,
    description: 'URL de redirecionamento após sucesso',
  })
  @IsUrl()
  @IsOptional()
  successUrl?: string;

  @ApiProperty({
    required: false,
    description: 'URL de redirecionamento após cancelamento',
  })
  @IsUrl()
  @IsOptional()
  cancelUrl?: string;
}
