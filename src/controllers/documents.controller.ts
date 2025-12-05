/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { DocumentsService } from '../services/documents.service';
import { UploadDocumentDto } from '../dto/documents/upload-document.dto';
import { Document } from '../models/documents/document.entity';

type MulterFile = Express.Multer.File;

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
  async upload(
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadDocumentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    return this.documentsService.create(file, req.user.organizationId, dto.agentId);
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
}
