import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PlugzApiWebhookData {
  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'ID da mensagem (alternativo)' })
  @IsString()
  @IsOptional()
  messageId?: string;

  @ApiProperty({ description: 'Número de telefone remetente' })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty({ description: 'Número de telefone (alternativo)' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({ description: 'Conteúdo da mensagem (alternativo)' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ description: 'Conteúdo da mensagem (alternativo)' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ description: 'Tipo da mensagem' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'URL da mídia' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ description: 'URL (alternativo)' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({ description: 'Status da mensagem' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Se a mensagem foi enviada por mim' })
  @IsOptional()
  fromMe?: boolean;

  @ApiProperty({ description: 'Timestamp da mensagem' })
  @IsOptional()
  timestamp?: number;

  [key: string]: any;
}

export class WebhookDto {
  @ApiProperty({ description: 'ID da instância PlugzAPI' })
  @IsString()
  instance: string;

  @ApiProperty({ description: 'Tipo do evento' })
  @IsString()
  event: string;

  @ApiProperty({
    description: 'Dados do evento',
    type: PlugzApiWebhookData,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PlugzApiWebhookData)
  data: PlugzApiWebhookData;
}
