import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { UploadedFile } from '../common/interfaces/file.interface';
import { Document, DocumentStatus } from '../models/documents/document.entity';
import { DocumentsResource } from '../resources/documents.resource';
import { OrganizationsService } from './organizations.service';
import { S3Service } from './s3.service';

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

  async create(file: UploadedFile, organizationId: string, agentId?: string): Promise<Document> {
    const fileType = this.getFileType(file.originalname, file.mimetype);
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(
        `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const organization = await this.organizationsService.findOne(organizationId);
    const existingDocuments = await this.documentsResource.count({
      organizationId,
    });

    if (existingDocuments >= organization.maxDocuments) {
      throw new BadRequestException(
        `Quota de documentos excedida. Limite: ${organization.maxDocuments}`,
      );
    }

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
      s3Key: '',
    });

    const s3Key = `${organizationId}/documents/${document.id}/${document.filename}`;
    try {
      await this.s3Service.uploadFile(s3Key, file.buffer, file.mimetype, {
        'organization-id': organizationId,
        'agent-id': agentId || '',
        'document-id': document.id,
      });

      const updatedDocument = await this.documentsResource.update(document.id, { s3Key });

      await this.documentQueue.add('process', {
        documentId: document.id,
      });

      this.logger.log(`Document ${document.id} uploaded and queued for processing`);

      return updatedDocument;
    } catch (error) {
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

  private getFileType(filename: string, mimetype: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';

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

    if (ALLOWED_FILE_TYPES.includes(extension)) {
      return extension;
    }

    return extension;
  }
}
