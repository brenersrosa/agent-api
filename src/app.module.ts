import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './modules/admin.module';
import { AgentsModule } from './modules/agents.module';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { AuthModule } from './modules/auth.module';
import { BillingModule } from './modules/billing.module';
import { CommonModule } from './modules/common.module';
import { DatabaseConfig } from './config/database.config';
import { DocumentsModule } from './modules/documents.module';
import { OrganizationsModule } from './modules/organizations.module';
import { PlansModule } from './modules/plans.module';
import { RagModule } from './modules/rag.module';
import { UsersModule } from './modules/users.module';
import { WebhooksModule } from './modules/webhooks.module';
import { WhatsAppModule } from './modules/whatsapp.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    // Redis / BullMQ
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

    // Application Modules
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
