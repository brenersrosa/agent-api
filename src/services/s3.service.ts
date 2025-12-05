import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

    this.bucket = this.configService.get<string>('S3_BUCKET', 'agent-documents-dev');

    const s3Config: AWS.S3.ClientConfiguration = {
      accessKeyId,
      secretAccessKey,
      region,
      s3ForcePathStyle: forcePathStyle,
    };

    if (endpoint) {
      s3Config.endpoint = endpoint;
    }

    this.s3 = new AWS.S3(s3Config);
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata || {},
      };

      await this.s3.putObject(params).promise();

      this.logger.log(`File uploaded successfully: ${key}`);

      return key;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: bucket,
        Key: key,
      };

      const result = await this.s3.getObject(params).promise();

      if (!result.Body) {
        throw new Error('Empty response body from S3');
      }

      if (Buffer.isBuffer(result.Body)) {
        return result.Body;
      }

      return Buffer.from(result.Body as any);
    } catch (error) {
      this.logger.error(`Error getting object from S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  getBucket(): string {
    return this.bucket;
  }
}

