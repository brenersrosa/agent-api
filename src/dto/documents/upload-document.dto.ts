import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'ID do agente para associar o documento (opcional)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  @IsString()
  agentId?: string;
}

