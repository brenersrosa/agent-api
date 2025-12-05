import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Número de telefone do destinatário (formato internacional, ex: 5511999999999)',
    example: '5511999999999',
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem (texto ou URL da mídia)',
    example: 'Olá! Esta é uma mensagem de teste.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    required: false,
    description: 'Tipo da mensagem',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;

  @ApiProperty({
    required: false,
    description: 'URL da mídia (para tipos image, audio, video, document)',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Delay em segundos antes de enviar (para fila)',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  delay?: number;
}
