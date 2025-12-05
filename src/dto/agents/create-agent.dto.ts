import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPhoneNumber, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ description: 'Nome do agente' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'URL do avatar do agente' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Prompt do sistema para o agente',
  })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiProperty({
    required: false,
    description: 'Modelo LLM a ser usado',
    default: 'gpt-4o',
  })
  @IsString()
  @IsOptional()
  llmModel?: string;

  @ApiProperty({
    required: false,
    description: 'Temperatura do modelo (0-1)',
    default: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  temperature?: number;

  @ApiProperty({
    required: false,
    description: 'Número máximo de tokens',
    default: 1000,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({
    required: false,
    description: 'Número de telefone do WhatsApp',
  })
  @IsString()
  @IsOptional()
  whatsappPhoneNumber?: string;
}
