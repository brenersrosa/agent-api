import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';

interface UploadProgress {
  uploadId: string;
  bytesReceived: number;
  totalBytes: number;
  organizationId: string;
  createdAt: number;
}

@Injectable()
export class UploadProgressService extends EventEmitter implements OnModuleDestroy {
  private readonly logger = new Logger(UploadProgressService.name);
  private readonly uploads = new Map<string, UploadProgress>();
  private readonly cleanupInterval: NodeJS.Timeout;
  private readonly UPLOAD_TIMEOUT = 30 * 60 * 1000;

  constructor() {
    super();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  createUpload(uploadId: string, totalBytes: number, organizationId: string): void {
    this.uploads.set(uploadId, {
      uploadId,
      bytesReceived: 0,
      totalBytes,
      organizationId,
      createdAt: Date.now(),
    });

    this.logger.debug(`Created upload tracking for ${uploadId}`);
  }

  updateProgress(uploadId: string, bytesReceived: number): void {
    const upload = this.uploads.get(uploadId);
    if (!upload) {
      this.logger.warn(`Upload ${uploadId} not found for progress update`);
      return;
    }

    upload.bytesReceived = bytesReceived;
    const progress = Math.min(100, Math.round((bytesReceived / upload.totalBytes) * 100));

    this.emit('progress', {
      uploadId,
      progress,
      bytesReceived,
      totalBytes: upload.totalBytes,
    });

    this.logger.debug(`Progress updated for ${uploadId}: ${progress}%`);
  }

  getProgress(uploadId: string): { progress: number; bytesReceived: number; totalBytes: number } | null {
    const upload = this.uploads.get(uploadId);
    if (!upload) {
      return null;
    }

    return {
      progress: Math.min(100, Math.round((upload.bytesReceived / upload.totalBytes) * 100)),
      bytesReceived: upload.bytesReceived,
      totalBytes: upload.totalBytes,
    };
  }

  completeUpload(uploadId: string): void {
    if (this.uploads.has(uploadId)) {
      this.uploads.delete(uploadId);
      this.emit('complete', { uploadId });
      this.logger.debug(`Upload ${uploadId} completed and removed from tracking`);
    }
  }

  errorUpload(uploadId: string, error: string): void {
    if (this.uploads.has(uploadId)) {
      this.uploads.delete(uploadId);
      this.emit('error', { uploadId, error });
      this.logger.debug(`Upload ${uploadId} errored and removed from tracking: ${error}`);
    }
  }

  subscribe(uploadId: string, callback: (data: any) => void): () => void {
    const progressHandler = (data: { uploadId: string }) => {
      if (data.uploadId === uploadId) {
        callback(data);
      }
    };

    const completeHandler = (data: { uploadId: string }) => {
      if (data.uploadId === uploadId) {
        callback({ ...data, progress: 100 });
        this.off('progress', progressHandler);
        this.off('complete', completeHandler);
        this.off('error', errorHandler);
      }
    };

    const errorHandler = (data: { uploadId: string; error: string }) => {
      if (data.uploadId === uploadId) {
        callback(data);
        this.off('progress', progressHandler);
        this.off('complete', completeHandler);
        this.off('error', errorHandler);
      }
    };

    this.on('progress', progressHandler);
    this.on('complete', completeHandler);
    this.on('error', errorHandler);

    return () => {
      this.off('progress', progressHandler);
      this.off('complete', completeHandler);
      this.off('error', errorHandler);
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [uploadId, upload] of this.uploads.entries()) {
      if (now - upload.createdAt > this.UPLOAD_TIMEOUT) {
        toRemove.push(uploadId);
      }
    }

    for (const uploadId of toRemove) {
      this.logger.warn(`Removing expired upload ${uploadId}`);
      this.uploads.delete(uploadId);
      this.emit('error', { uploadId, error: 'Upload timeout' });
    }
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
