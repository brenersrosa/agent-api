import { ApiProperty } from '@nestjs/swagger';

export class SourceDto {
  @ApiProperty({ description: 'ID do documento' })
  documentId: string;

  @ApiProperty({ description: 'Nome do documento', required: false })
  documentName?: string;

  @ApiProperty({ description: 'Índice do chunk no documento' })
  chunkIndex: number;

  @ApiProperty({ description: 'Score de similaridade', required: false })
  similarity?: number;

  @ApiProperty({ description: 'Trecho do conteúdo do chunk', required: false })
  excerpt?: string;
}

export class QueryResponseDto {
  @ApiProperty({ description: 'Resposta gerada pelo RAG' })
  answer: string;

  @ApiProperty({ description: 'Fontes utilizadas na resposta', type: [SourceDto] })
  sources: SourceDto[];

  @ApiProperty({ description: 'ID da query (para rastreamento)', nullable: true })
  queryId: string | null;

  @ApiProperty({ description: 'Tempo de processamento em milissegundos' })
  processingTimeMs: number;

  @ApiProperty({ description: 'Modelo LLM utilizado' })
  model: string;

  @ApiProperty({ description: 'Tokens utilizados na geração' })
  tokensUsed: number;
}

