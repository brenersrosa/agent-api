import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service implements OnModuleInit {
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
      s3Config.s3BucketEndpoint = false;
      
      const isHttps = endpoint.startsWith('https://');
      if (!isHttps) {
        s3Config.sslEnabled = false;
        s3Config.signatureVersion = 'v4';
      }
    }

    this.s3 = new AWS.S3(s3Config);
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.bucketExists(this.bucket);
      if (!exists) {
        this.logger.log(`Bucket ${this.bucket} does not exist. Creating...`);
        await this.createBucket(this.bucket);
        this.logger.log(`Bucket ${this.bucket} created successfully`);
      } else {
        this.logger.log(`Bucket ${this.bucket} already exists`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code || error?.statusCode;
      
      this.logger.error(
        `Error ensuring bucket exists: ${errorMessage} (Code: ${errorCode || 'N/A'}). You may need to create the bucket manually.`,
        error?.stack,
      );
      
      this.logger.error(`S3 Configuration at initialization:`, {
        endpoint: this.configService.get<string>('S3_ENDPOINT'),
        bucket: this.bucket,
        region: this.configService.get<string>('S3_REGION'),
        forcePathStyle: this.configService.get<string>('S3_FORCE_PATH_STYLE'),
        hasAccessKey: !!this.configService.get<string>('S3_ACCESS_KEY_ID'),
        hasSecretKey: !!this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      });
    }
  }

  private async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.s3.headBucket({ Bucket: bucketName }).promise();
      return true;
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  private async createBucket(bucketName: string): Promise<void> {
    try {
      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      const region = this.configService.get<string>('S3_REGION', 'us-east-1');
      const forcePathStyle =
        this.configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

      const params: AWS.S3.CreateBucketRequest = {
        Bucket: bucketName,
      };

      if (endpoint && forcePathStyle) {
        await this.s3.createBucket(params).promise();
      } else {
        if (region !== 'us-east-1') {
          params.CreateBucketConfiguration = {
            LocationConstraint: region,
          };
        }
        await this.s3.createBucket(params).promise();
      }
    } catch (error: any) {
      if (
        error.code === 'BucketAlreadyOwnedByYou' ||
        error.code === 'BucketAlreadyExists' ||
        error.message?.includes('already exists')
      ) {
        this.logger.log(`Bucket ${bucketName} already exists`);
        return;
      }
      throw error;
    }
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

