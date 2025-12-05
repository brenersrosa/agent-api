import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from '../config/database.config';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { AdminModule } from './admin.module';
import { AgentsModule } from './agents.module';
import { AuthModule } from './auth.module';
import { BillingModule } from './billing.module';
import { CommonModule } from './common.module';
import { DocumentsModule } from './documents.module';
import { OrganizationsModule } from './organizations.module';
import { PlansModule } from './plans.module';
import { RagModule } from './rag.module';
import { UsersModule } from './users.module';
import { WebhooksModule } from './webhooks.module';
import { WhatsAppModule } from './whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AgentsModule,
    DocumentsModule,
    RagModule,
    WhatsAppModule,
    BillingModule,
    PlansModule,
    AdminModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
