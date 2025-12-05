import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { UploadedFile } from '../common/interfaces/file.interface';

const ALLOWED_IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

@Injectable()
export class AgentAvatarService {
  private readonly logger = new Logger(AgentAvatarService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  validateFile(file: UploadedFile): void {
    const fileType = this.getFileType(file.originalname, file.mimetype);

    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new PayloadTooLargeException(
        `Arquivo muito grande. Tamanho máximo: ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  async uploadAvatar(
    file: UploadedFile,
    organizationId: string,
    agentId: string,
  ): Promise<string> {
    this.validateFile(file);

    const fileExtension = this.getFileExtension(file.originalname, file.mimetype);
    const s3Key = `${organizationId}/avatars/${agentId}/avatar.${fileExtension}`;

    try {
      await this.s3Service.uploadFile(s3Key, file.buffer, file.mimetype, {
        'organization-id': organizationId,
        'agent-id': agentId,
        'uploaded-at': new Date().toISOString(),
      });

      this.logger.log(`Avatar uploaded successfully for agent ${agentId}`);

      const bucket = this.s3Service.getBucket();
      const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
      const region = this.configService.get<string>('S3_REGION', 'us-east-1');
      const forcePathStyle = this.configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

      if (endpoint && forcePathStyle) {
        return `${endpoint}/${bucket}/${s3Key}`;
      }

      if (endpoint) {
        return `${endpoint}/${s3Key}`;
      }

      return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.code || (error as any)?.statusCode;
      const errorDetails = error instanceof Error && error.stack ? error.stack : undefined;
      
      this.logger.error(
        `Error uploading avatar to S3. Message: ${errorMessage}, Code: ${errorCode}`,
        errorDetails,
      );
      
      this.logger.error(`S3 Configuration:`, {
        endpoint: this.configService.get<string>('S3_ENDPOINT'),
        bucket: this.s3Service.getBucket(),
        region: this.configService.get<string>('S3_REGION'),
        forcePathStyle: this.configService.get<string>('S3_FORCE_PATH_STYLE'),
        hasAccessKey: !!this.configService.get<string>('S3_ACCESS_KEY_ID'),
        hasSecretKey: !!this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      });
      
      if (errorCode === 404 || errorMessage.includes('NoSuchBucket') || errorMessage.includes('NotFound')) {
        throw new BadRequestException(
          `Bucket não encontrado. Certifique-se de que o bucket '${this.s3Service.getBucket()}' existe no MinIO. Verifique os logs da aplicação para mais detalhes.`,
        );
      }
      
      if (errorCode === 403 || errorMessage.includes('AccessDenied') || errorMessage.includes('Forbidden')) {
        throw new BadRequestException(
          'Acesso negado ao S3. Verifique as credenciais (S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY) no arquivo .env.',
        );
      }
      
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('connect')) {
        throw new BadRequestException(
          `Não foi possível conectar ao MinIO em ${this.configService.get<string>('S3_ENDPOINT')}. Verifique se o MinIO está rodando.`,
        );
      }
      
      throw new BadRequestException(
        `Erro ao fazer upload do avatar para S3: ${errorMessage} (Código: ${errorCode || 'N/A'}). Verifique os logs da aplicação para mais detalhes.`,
      );
    }
  }

  async deleteAvatar(avatarUrl: string, organizationId: string, agentId: string): Promise<void> {
    if (!avatarUrl) {
      return;
    }

    const s3Key = this.extractS3KeyFromUrl(avatarUrl, organizationId, agentId);
    if (!s3Key) {
      this.logger.warn(`Avatar URL does not appear to be from S3: ${avatarUrl}`);
      return;
    }

    try {
      await this.s3Service.deleteFile(s3Key);
      this.logger.log(`Avatar deleted successfully for agent ${agentId}`);
    } catch (error) {
      this.logger.error(`Error deleting avatar from S3: ${error.message}`, error.stack);
    }
  }

  private getFileType(filename: string, mimetype: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    const mimeTypeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    if (mimeTypeMap[mimetype]) {
      return mimeTypeMap[mimetype];
    }

    if (ALLOWED_IMAGE_TYPES.includes(extension)) {
      return extension;
    }

    return extension;
  }

  private getFileExtension(filename: string, mimetype: string): string {
    const fileType = this.getFileType(filename, mimetype);
    return fileType || filename.split('.').pop()?.toLowerCase() || 'png';
  }

  private extractS3KeyFromUrl(url: string, organizationId: string, agentId: string): string | null {
    const expectedPath = `${organizationId}/avatars/${agentId}/avatar.`;

    if (!url.includes(expectedPath)) {
      return null;
    }

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      const pathIndex = pathname.indexOf(expectedPath);
      if (pathIndex === -1) {
        return null;
      }

      const keyStart = pathname.substring(pathIndex);
      const key = keyStart.split('?')[0];

      if (key.startsWith('/')) {
        return key.substring(1);
      }

      return key;
    } catch {
      const pathIndex = url.indexOf(expectedPath);
      if (pathIndex === -1) {
        return null;
      }

      const keyStart = url.substring(pathIndex);
      const key = keyStart.split('?')[0].split('#')[0];

      if (key.startsWith('/')) {
        return key.substring(1);
      }

      return key;
    }
  }
}
