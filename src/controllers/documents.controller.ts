import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadedFile } from '../common/interfaces/file.interface';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { UploadDocumentDto } from '../dto/documents/upload-document.dto';
import { Document } from '../models/documents/document.entity';
import { DocumentsService } from '../services/documents.service';
import { UploadProgressService } from '../services/upload-progress.service';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly uploadProgressService: UploadProgressService,
  ) {}

  @Get('upload/progress/:uploadId')
  @ApiOperation({ summary: 'Obter progresso do upload via Server-Sent Events' })
  @ApiParam({ name: 'uploadId', description: 'ID do upload' })
  @ApiResponse({
    status: 200,
    description: 'Stream de eventos SSE com progresso do upload',
  })
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async getUploadProgress(
    @Param('uploadId') uploadId: string,
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const progress = this.uploadProgressService.getProgress(uploadId);
    if (!progress) {
      reply.status(404).send({ message: 'Upload not found' });
      return;
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (data: any) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const unsubscribe = this.uploadProgressService.subscribe(uploadId, (data) => {
      sendEvent(data);

      if (data.progress === 100 || data.error) {
        setTimeout(() => {
          reply.raw.end();
        }, 100);
      }
    });

    sendEvent({
      uploadId,
      progress: progress.progress,
      bytesReceived: progress.bytesReceived,
      totalBytes: progress.totalBytes,
    });

    reply.raw.on('close', () => {
      unsubscribe();
    });
  }

  @Post('upload')
  @ApiOperation({ summary: 'Enviar documento para processamento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo a ser enviado (PDF, DOCX, MD, TXT, PNG, JPG, JPEG)',
        },
        agentId: {
          type: 'string',
          format: 'uuid',
          description: 'ID do agente para associar o documento (opcional)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento enviado com sucesso e enfileirado para processamento',
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação (tipo de arquivo, tamanho, quota)',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 413, description: 'Arquivo muito grande' })
  async upload(@Req() req: AuthenticatedRequest) {
    const uploadId = (req.headers['x-upload-id'] as string) || undefined;
    const parts = req.parts();
    let file: UploadedFile | null = null;
    let agentId: string | undefined;

    try {
      const contentLengthHeader = req.headers['content-length'];
      const totalBytes = contentLengthHeader
        ? Number.parseInt(contentLengthHeader as string, 10)
        : 0;

      if (uploadId && totalBytes > 0) {
        this.uploadProgressService.createUpload(uploadId, totalBytes, req.user.organizationId);
        this.uploadProgressService.updateProgress(uploadId, 0);
      }

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer();

          file = {
            fieldname: part.fieldname,
            originalname: part.filename || 'unknown',
            encoding: part.encoding,
            mimetype: part.mimetype,
            size: buffer.length,
            buffer: buffer,
          };

          if (uploadId) {
            const finalSize = buffer.length;
            if (totalBytes === 0 || totalBytes !== finalSize) {
              this.uploadProgressService.createUpload(uploadId, finalSize, req.user.organizationId);
            }
            this.uploadProgressService.updateProgress(uploadId, finalSize);
          }
        } else if (part.fieldname === 'agentId') {
          agentId = part.value as string;
        }
      }

      if (!file) {
        if (uploadId) {
          this.uploadProgressService.errorUpload(uploadId, 'Arquivo não fornecido');
        }
        throw new BadRequestException('Arquivo não fornecido');
      }

      const document = await this.documentsService.create(file, req.user.organizationId, agentId);

      if (uploadId) {
        this.uploadProgressService.completeUpload(uploadId);
      }

      return document;
    } catch (error) {
      if (uploadId) {
        this.uploadProgressService.errorUpload(
          uploadId,
          error instanceof Error ? error.message : 'Erro desconhecido',
        );
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos da organização' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos retornada com sucesso',
    type: [Document],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.documentsService.findByOrganization(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter documento por ID' })
  @ApiParam({ name: 'id', description: 'ID do documento' })
  @ApiResponse({
    status: 200,
    description: 'Documento retornado com sucesso',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  @ApiParam({ name: 'id', description: 'ID do documento' })
  @ApiResponse({ status: 200, description: 'Documento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocessar documento específico' })
  @ApiParam({ name: 'id', description: 'ID do documento' })
  @ApiResponse({
    status: 200,
    description: 'Documento enfileirado para reprocessamento',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  @ApiResponse({ status: 400, description: 'Documento não pode ser reprocessado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  reprocess(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.documentsService.reprocess(id);
  }

  @Post('reprocess/all')
  @ApiOperation({
    summary: 'Reprocessar todos os documentos pendentes ou falhados da organização',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentos enfileirados para reprocessamento',
    schema: {
      type: 'object',
      properties: {
        queued: { type: 'number', description: 'Número de documentos enfileirados' },
        documents: {
          type: 'array',
          items: { $ref: '#/components/schemas/Document' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  reprocessAll(@Request() req: AuthenticatedRequest) {
    return this.documentsService.reprocessAll(req.user.organizationId);
  }
}
