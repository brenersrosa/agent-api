import { Injectable, Logger } from '@nestjs/common';
import { DocumentChunk } from '../models/documents/document-chunk.entity';

export interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);
  private readonly DEFAULT_CHUNK_SIZE = 500; // tokens aproximados
  private readonly DEFAULT_OVERLAP = 50; // tokens aproximados

  /**
   * Cria chunks de texto preservando contexto
   * Usa uma aproximação de tokens baseada em caracteres (1 token ≈ 4 caracteres)
   */
  async createChunks(
    text: string,
    documentId: string,
    metadata: Record<string, any> = {},
    options: ChunkingOptions = {},
  ): Promise<Omit<DocumentChunk, 'id' | 'createdAt' | 'document'>[]> {
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const overlap = options.overlap || this.DEFAULT_OVERLAP;

    // Aproximação: 1 token ≈ 4 caracteres
    const chunkSizeChars = chunkSize * 4;
    const overlapChars = overlap * 4;

    if (text.length <= chunkSizeChars) {
      return [
        {
          documentId,
          chunkIndex: 0,
          content: text.trim(),
          tokenCount: this.estimateTokens(text),
          pageNumber: metadata.pageNumber || null,
          metadata: { ...metadata, chunkIndex: 0 },
        },
      ];
    }

    const chunks: Omit<DocumentChunk, 'id' | 'createdAt' | 'document'>[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + chunkSizeChars, text.length);

      // Se não é o último chunk, tenta quebrar em um ponto natural (fim de frase, parágrafo)
      if (endIndex < text.length) {
        const chunkText = text.substring(startIndex, endIndex);
        
        // Procura por quebra de parágrafo primeiro
        const paragraphBreak = chunkText.lastIndexOf('\n\n');
        if (paragraphBreak > chunkSizeChars * 0.5) {
          endIndex = startIndex + paragraphBreak + 2;
        } else {
          // Procura por fim de frase (., !, ? seguido de espaço)
          const sentenceRegex = /[.!?]\s/g;
          let lastMatch: RegExpExecArray | null = null;
          let match: RegExpExecArray | null;
          while ((match = sentenceRegex.exec(chunkText)) !== null) {
            if (match.index > chunkSizeChars * 0.5) {
              lastMatch = match;
              break;
            }
            lastMatch = match;
          }
          
          if (lastMatch && lastMatch.index > chunkSizeChars * 0.5) {
            endIndex = startIndex + lastMatch.index + lastMatch[0].length;
          } else {
            // Procura por espaço em branco
            const spaceIndex = chunkText.lastIndexOf(' ');
            if (spaceIndex > chunkSizeChars * 0.5) {
              endIndex = startIndex + spaceIndex + 1;
            }
          }
        }
      }

      const chunkText = text.substring(startIndex, endIndex).trim();
      if (chunkText.length > 0) {
        chunks.push({
          documentId,
          chunkIndex,
          content: chunkText,
          tokenCount: this.estimateTokens(chunkText),
          pageNumber: metadata.pageNumber || null,
          metadata: { ...metadata, chunkIndex },
        });
        chunkIndex++;
      }

      // Move o startIndex considerando o overlap
      startIndex = Math.max(startIndex + 1, endIndex - overlapChars);
    }

    this.logger.log(`Created ${chunks.length} chunks for document ${documentId}`);
    return chunks;
  }

  /**
   * Estima o número de tokens baseado em caracteres
   * Aproximação: 1 token ≈ 4 caracteres (para inglês/português)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

