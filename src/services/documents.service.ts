import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DocumentsResource } from '../resources/documents.resource';
import { OrganizationsService } from './organizations.service';
import { S3Service } from './s3.service';
import { Document, DocumentStatus } from '../models/documents/document.entity';

type MulterFile = Express.Multer.File;

const ALLOWED_FILE_TYPES = ['pdf', 'docx', 'md', 'txt', 'png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB default

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsResource: DocumentsResource,
    private s3Service: S3Service,
    private organizationsService: OrganizationsService,
    @InjectQueue('document.process')
    private documentQueue: Queue,
  ) {}

  async create(
    file: MulterFile,
    organizationId: string,
    agentId?: string,
  ): Promise<Document> {
    // 1. Validar tipo de arquivo
    const fileType = this.getFileType(file.originalname, file.mimetype);
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(', ')}`,
      );
    }

    // 2. Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // 3. Validar quota de documentos da organização
    const organization = await this.organizationsService.findOne(organizationId);
    const existingDocuments = await this.documentsResource.count({
      organizationId,
    });

    if (existingDocuments >= organization.maxDocuments) {
      throw new BadRequestException(
        `Quota de documentos excedida. Limite: ${organization.maxDocuments}`,
      );
    }

    // 4. Criar registro do documento
    const document = await this.documentsResource.create({
      organizationId,
      agentId: agentId || null,
      filename: `${Date.now()}-${file.originalname}`,
      originalFilename: file.originalname,
      fileType,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: DocumentStatus.UPLOADED,
      metadata: {},
      s3Bucket: this.s3Service.getBucket(),
      s3Key: '', // Será preenchido após upload
    });

    // 5. Upload para S3
    const s3Key = `${organizationId}/documents/${document.id}/${document.filename}`;
    try {
      await this.s3Service.uploadFile(
        s3Key,
        file.buffer,
        file.mimetype,
        {
          'organization-id': organizationId,
          'agent-id': agentId || '',
          'document-id': document.id,
        },
      );

      // 6. Atualizar documento com S3 key
      await this.documentsResource.update(document.id, { s3Key });

      // 7. Enfileirar job de processamento
      await this.documentQueue.add('process', {
        documentId: document.id,
      });

      this.logger.log(
        `Document ${document.id} uploaded and queued for processing`,
      );

      const updatedDocument = await this.documentsResource.findOne(document.id);
      return updatedDocument!;
    } catch (error) {
      // Em caso de erro no upload, remover o documento do banco
      await this.documentsResource.remove(document);
      this.logger.error(`Error uploading document to S3: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao fazer upload do arquivo para S3');
    }
  }

  async findByOrganization(organizationId: string): Promise<Document[]> {
    return this.documentsResource.findByOrganization(organizationId);
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsResource.findOne(id, ['chunks']);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    await this.documentsResource.remove(document);
  }

  /**
   * Determina o tipo de arquivo baseado na extensão e MIME type
   */
  private getFileType(filename: string, mimetype: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Mapear MIME types para tipos de arquivo
    const mimeTypeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'docx',
      'text/markdown': 'md',
      'text/plain': 'txt',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
    };

    if (mimeTypeMap[mimetype]) {
      return mimeTypeMap[mimetype];
    }

    // Fallback para extensão
    if (ALLOWED_FILE_TYPES.includes(extension)) {
      return extension;
    }

    return extension;
  }
}

