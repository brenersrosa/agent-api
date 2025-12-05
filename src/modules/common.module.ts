import { Global, Module } from '@nestjs/common';
import { S3Service } from '../services/s3.service';
import { LlmService } from '../services/llm.service';

@Global()
@Module({
  providers: [S3Service, LlmService],
  exports: [S3Service, LlmService],
})
export class CommonModule {}
