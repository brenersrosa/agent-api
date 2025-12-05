import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LlmResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface LlmRequest {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly openai: OpenAI;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY não configurada. LLM não funcionará.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });

    this.defaultModel = this.configService.get<string>('OPENAI_LLM_MODEL') || 'gpt-4o';
    this.defaultMaxTokens = Number.parseInt(
      this.configService.get<string>('OPENAI_MAX_TOKENS') || '1000',
      10,
    );
  }

  /**
   * Gera uma resposta usando o OpenAI Chat Completions API
   */
  async generateResponse(request: LlmRequest): Promise<LlmResponse> {
    if (!this.configService.get<string>('OPENAI_API_KEY')) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const model = request.model || this.defaultModel;
    const temperature = request.temperature ?? 0.7;
    const maxTokens = request.maxTokens || this.defaultMaxTokens;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: request.userPrompt,
    });

    try {
      this.logger.log(`Generating LLM response with model ${model}`);

      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      this.logger.log(`LLM response generated. Tokens used: ${tokensUsed}`);

      return {
        content,
        tokensUsed,
        model,
      };
    } catch (error) {
      this.logger.error(`Error generating LLM response: ${error.message}`, error.stack);
      throw new Error(`Falha ao gerar resposta do LLM: ${error.message}`);
    }
  }
}

