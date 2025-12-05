import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../models/whatsapp/conversation.entity';
import { Message } from '../models/whatsapp/message.entity';
import { WhatsAppController } from '../controllers/whatsapp.controller';
import { WhatsAppService } from '../services/whatsapp.service';
import { ConversationsResource } from '../resources/conversations.resource';
import { MessagesResource } from '../resources/messages.resource';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, ConversationsResource, MessagesResource],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
