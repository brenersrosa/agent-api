import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QueryDto } from '../dto/rag/query.dto';
import { QueryResponseDto, SourceDto } from '../dto/rag/query-response.dto';
import { Agent } from '../models/agents/agent.entity';
import { DocumentsResource } from '../resources/documents.resource';
import { AgentsService } from './agents.service';
import { EmbeddingsService } from './embeddings.service';
import { LlmService } from './llm.service';
import { VectorSearchOptions, VectorService } from './vector.service';

interface RagQueryDto extends QueryDto {
  organizationId: string;
}

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente especializado em responder perguntas baseado em documentos fornecidos.
Sua função é analisar o contexto fornecido e responder perguntas de forma clara e precisa.
IMPORTANTE: Responda APENAS com base nas informações presentes no contexto fornecido.
Se a informação não estiver no contexto, diga que não possui essa informação nos documentos disponíveis.
Seja objetivo e cite as fontes quando relevante.`;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly vectorService: VectorService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly llmService: LlmService,
    private readonly agentsService: AgentsService,
    private readonly documentsResource: DocumentsResource,
  ) {}

  async query(dto: RagQueryDto): Promise<QueryResponseDto> {
    const startTime = Date.now();
    const queryId = randomUUID();

    try {
      // 1. Buscar agente se fornecido
      let agent: Agent | null = null;
      if (dto.agentId) {
        try {
          agent = await this.agentsService.findOneWithOrganization(
            dto.agentId,
            dto.organizationId,
          );
        } catch (error) {
          this.logger.warn(`Agent ${dto.agentId} not found or doesn't belong to organization`);
        }
      }

      // 2. Gerar embedding da query
      this.logger.log(`Generating embedding for query: ${dto.query.substring(0, 50)}...`);
      const queryEmbedding = await this.embeddingsService.generateEmbedding(dto.query);

      // 3. Buscar chunks similares
      const searchOptions: VectorSearchOptions = {
        organizationId: dto.organizationId,
        agentId: dto.agentId,
        topK: dto.maxResults || 5,
        minScore: 0.7,
      };

      this.logger.log(`Searching for similar chunks with topK=${searchOptions.topK}`);
      const searchResults = await this.vectorService.search(queryEmbedding, searchOptions);

      if (searchResults.length === 0) {
        this.logger.warn('No similar chunks found');
        return {
          answer:
            'Não encontrei informações relevantes nos documentos disponíveis para responder sua pergunta.',
          sources: [],
          queryId,
          processingTimeMs: Date.now() - startTime,
          model: agent?.llmModel || 'gpt-4o',
          tokensUsed: 0,
        };
      }

      this.logger.log(`Found ${searchResults.length} similar chunks`);

      // 4. Buscar informações dos documentos para as fontes
      const documentIds = [...new Set(searchResults.map((r) => r.documentId))];
      const documents = await Promise.all(
        documentIds.map((id) => this.documentsResource.findOne(id)),
      );
      const documentMap = new Map(
        documents.filter((d) => d !== null).map((d) => [d!.id, d!]),
      );

      // 5. Construir prompt com contexto
      const contextChunks = searchResults
        .map((result, index) => {
          const doc = documentMap.get(result.documentId);
          const docName = doc?.originalFilename || 'Documento desconhecido';
          return `[Fonte ${index + 1}: ${docName}]\n${result.content}`;
        })
        .join('\n\n---\n\n');

      const systemPrompt = agent?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      const userPrompt = `Contexto dos documentos:

${contextChunks}

Pergunta do usuário: ${dto.query}

Instruções:
- Responda baseado APENAS no contexto fornecido acima
- Se a informação não estiver no contexto, diga que não possui essa informação nos documentos disponíveis
- Cite as fontes quando relevante (ex: "Conforme o documento X...")
- Seja claro e objetivo`;

      // 6. Chamar LLM
      const model = agent?.llmModel || 'gpt-4o';
      // Garante que temperature seja um número (pode vir como string do banco)
      const temperature = agent?.temperature
        ? Number.parseFloat(String(agent.temperature))
        : 0.7;
      const maxTokens = agent?.maxTokens || 1000;

      this.logger.log(`Generating LLM response with model ${model}`);
      const llmResponse = await this.llmService.generateResponse({
        systemPrompt,
        userPrompt,
        model,
        temperature,
        maxTokens,
      });

      // 7. Construir array de fontes
      const sources: SourceDto[] = searchResults.map((result) => {
        const doc = documentMap.get(result.documentId);
        return {
          documentId: result.documentId,
          documentName: doc?.originalFilename,
          chunkIndex: result.chunkIndex,
          similarity: result.similarity,
          excerpt: result.content.substring(0, 200),
        };
      });

      const processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `RAG query completed in ${processingTimeMs}ms. Tokens used: ${llmResponse.tokensUsed}`,
      );

      return {
        answer: llmResponse.content,
        sources,
        queryId,
        processingTimeMs,
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
      };
    } catch (error) {
      this.logger.error(`Error processing RAG query: ${error.message}`, error.stack);
      throw error;
    }
  }
}
