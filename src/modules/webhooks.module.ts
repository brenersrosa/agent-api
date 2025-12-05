import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from '../models/webhooks/webhook-event.entity';
import { WebhooksController } from '../controllers/webhooks.controller';
import { WebhooksService } from '../services/webhooks.service';
import { WebhookEventsResource } from '../resources/webhook-events.resource';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEvent])],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookEventsResource],
  exports: [WebhooksService],
})
export class WebhooksModule {}
