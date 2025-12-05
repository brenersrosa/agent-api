import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryDto {
  @ApiProperty({ description: 'Consulta/pergunta para o RAG' })
  @IsString()
  query: string;

  @ApiProperty({
    required: false,
    description: 'ID do agente a ser usado',
  })
  @IsUUID()
  @IsOptional()
  agentId?: string;

  @ApiProperty({
    required: false,
    description: 'Número máximo de resultados',
    default: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxResults?: number;
}
