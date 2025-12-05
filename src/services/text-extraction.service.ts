import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

export interface ExtractionResult {
  text: string;
  metadata: Record<string, any>;
}

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  async extractFromPdf(buffer: Buffer): Promise<ExtractionResult> {
    try {
      const data = await pdfParse(buffer);
      const metadata: Record<string, any> = {
        pages: data.numpages,
        title: data.info?.Title || null,
        author: data.info?.Author || null,
        creator: data.info?.Creator || null,
        producer: data.info?.Producer || null,
        creationDate: data.info?.CreationDate || null,
        modificationDate: data.info?.ModDate || null,
      };

      return {
        text: data.text,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Error extracting text from PDF: ${error.message}`, error.stack);
      throw new Error(`Falha ao extrair texto do PDF: ${error.message}`);
    }
  }

  async extractFromDocx(buffer: Buffer): Promise<ExtractionResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const metadata: Record<string, any> = {
        extracted: true,
      };

      return {
        text: result.value,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Error extracting text from DOCX: ${error.message}`, error.stack);
      throw new Error(`Falha ao extrair texto do DOCX: ${error.message}`);
    }
  }

  async extractFromImage(buffer: Buffer): Promise<ExtractionResult> {
    try {
      const worker = await createWorker('por');
      const { data } = await worker.recognize(buffer);
      await worker.terminate();

      const metadata: Record<string, any> = {
        confidence: data.confidence,
        extracted: true,
      };

      return {
        text: data.text,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Error extracting text from image: ${error.message}`, error.stack);
      throw new Error(`Falha ao extrair texto da imagem: ${error.message}`);
    }
  }

  async extractFromText(buffer: Buffer): Promise<ExtractionResult> {
    try {
      const text = buffer.toString('utf-8');
      return {
        text,
        metadata: {},
      };
    } catch (error) {
      this.logger.error(`Error extracting text from plain text: ${error.message}`, error.stack);
      throw new Error(`Falha ao extrair texto: ${error.message}`);
    }
  }

  extract(fileType: string, buffer: Buffer): Promise<ExtractionResult> {
    switch (fileType) {
      case 'pdf':
        return this.extractFromPdf(buffer);
      case 'docx':
        return this.extractFromDocx(buffer);
      case 'png':
      case 'jpg':
      case 'jpeg':
        return this.extractFromImage(buffer);
      case 'md':
      case 'txt':
        return this.extractFromText(buffer);
      default:
        throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
    }
  }
}

