import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  getErrorMessage,
  getErrorResponseData,
  getErrorStack,
} from '../common/helpers/error.helper';
import { PlugzApiWebhookData } from '../dto/whatsapp/webhook.dto';
import { Conversation, ConversationStatus } from '../models/whatsapp/conversation.entity';
import { MessageDirection, MessageType } from '../models/whatsapp/message.entity';
import { ConversationsResource } from '../resources/conversations.resource';
import { MessagesResource } from '../resources/messages.resource';

interface PlugzApiResponseData {
  messageId?: string;
  id?: string;
  [key: string]: unknown;
}

interface PlugzApiResponse {
  success: boolean;
  message?: string;
  data?: PlugzApiResponseData | PlugzApiResponseData[];
}

interface PlugzApiWebhook {
  instance: string;
  event: string;
  data: PlugzApiWebhookData;
}

interface PlugzApiChat {
  id?: string;
  phone?: string;
  phoneNumber?: string;
  name?: string;
  contactName?: string;
  unreadCount?: number;
  lastMessage?: string;
  timestamp?: number;
}

interface PlugzApiMessage {
  id?: string;
  messageId?: string;
  fromMe?: boolean;
  body?: string;
  message?: string;
  text?: string;
  type?: string;
  mediaUrl?: string;
  url?: string;
}

type PlugzApiMessagePayload =
  | { phone: string; delay: number; message: string }
  | { phone: string; delay: number; image: string; caption: string }
  | { phone: string; delay: number; audio: string }
  | { phone: string; delay: number; video: string; caption: string }
  | { phone: string; delay: number; document: string; fileName: string };

interface SendMessageParams {
  to: string;
  message: string;
  messageType?: string;
  mediaUrl?: string;
  organizationId: string;
  delay?: number;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly instanceId: string;
  private readonly token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly conversationsResource: ConversationsResource,
    private readonly messagesResource: MessagesResource,
  ) {
    this.baseUrl =
      this.configService.get<string>('PLUGZAPI_BASE_URL') || 'https://api.plugzapi.com.br';
    this.instanceId = this.configService.get<string>('PLUGZAPI_INSTANCE_ID') || '';
    this.token = this.configService.get<string>('PLUGZAPI_TOKEN') || '';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      apikey: this.token,
    };
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = `55${cleaned}`;
    }
    return cleaned;
  }

  async sendMessage(params: SendMessageParams) {
    const { to, message, messageType, mediaUrl, delay } = params;
    const phone = this.formatPhoneNumber(to);

    try {
      let endpoint = '';
      let payload: PlugzApiMessagePayload;

      switch (messageType) {
        case 'image':
          endpoint = '/message/send-message-image';
          payload = {
            phone,
            delay: delay || 0,
            image: mediaUrl || message,
            caption: message,
          };
          break;
        case 'audio':
          endpoint = '/message/send-message-audio';
          payload = {
            phone,
            delay: delay || 0,
            audio: mediaUrl || message,
          };
          break;
        case 'video':
          endpoint = '/message/send-message-video';
          payload = {
            phone,
            delay: delay || 0,
            video: mediaUrl || message,
            caption: message,
          };
          break;
        case 'document':
          endpoint = '/message/send-message-document';
          payload = {
            phone,
            delay: delay || 0,
            document: mediaUrl || message,
            fileName: message,
          };
          break;
        default:
          endpoint = '/message/send-message-text';
          payload = {
            phone,
            delay: delay || 0,
            message,
          };
      }

      const url = `${this.baseUrl}${endpoint}`;
      this.logger.log(`Enviando mensagem para ${phone} via ${endpoint}`);

      const response = await firstValueFrom(
        this.httpService.post<PlugzApiResponse>(url, payload, {
          headers: this.getHeaders(),
        }),
      );

      if (response.data.success && response.data.data) {
        const data = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
        const messageId = data?.messageId || data?.id;

        await this.saveOutboundMessage(
          params.organizationId,
          phone,
          message,
          messageType || 'text',
          mediaUrl,
          messageId,
        );

        return {
          success: true,
          messageId,
          status: 'sent',
        };
      }

      throw new Error(response.data.message || 'Erro ao enviar mensagem');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      const responseData = getErrorResponseData(error);
      this.logger.error(`Erro ao enviar mensagem: ${errorMessage}`, errorStack);
      throw new Error(
        (responseData && typeof responseData === 'object' && 'message' in responseData
          ? String(responseData.message)
          : null) ||
          errorMessage ||
          'Erro ao enviar mensagem',
      );
    }
  }

  async handleWebhook(body: PlugzApiWebhook) {
    try {
      this.logger.log(`Webhook recebido: ${body.event}`, JSON.stringify(body));

      const { event, data, instance } = body;

      switch (event) {
        case 'on-message-received':
          await this.handleIncomingMessage(data);
          break;
        case 'on-message-send':
          await this.handleMessageSent(data);
          break;
        case 'on-whatsapp-message-status-changes':
          await this.handleMessageStatus(data);
          break;
        case 'on-whatsapp-disconnected':
          this.logger.warn(`Instância desconectada: ${instance}`);
          break;
        case 'on-webhook-connected':
          this.logger.log(`Webhook conectado: ${instance}`);
          break;
        default:
          this.logger.debug(`Evento não tratado: ${event}`);
      }

      return { status: 'ok', event };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao processar webhook: ${errorMessage}`, errorStack);
      return { status: 'error', message: errorMessage };
    }
  }

  private async handleIncomingMessage(data: PlugzApiWebhookData) {
    try {
      const phone = data.from || data.phone;
      const messageContent = data.body || data.message || data.text || '';
      const messageId = data.id || data.messageId;
      const messageType = this.mapPlugzMessageType(data.type);

      const conversation = await this.conversationsResource.findOneByPhone(phone);

      if (!conversation) {
        this.logger.warn(
          `Conversa não encontrada para ${phone}. Criar conversa requer organizationId.`,
        );
        return;
      }

      await this.messagesResource.create({
        conversationId: conversation.id,
        direction: MessageDirection.INBOUND,
        whatsappMessageId: messageId,
        content: messageContent,
        messageType,
        mediaUrl: data.mediaUrl || data.url || null,
      });

      await this.conversationsResource.save({
        ...conversation,
        lastMessageAt: new Date(),
      });

      this.logger.log(`Mensagem recebida salva: ${messageId}`);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao processar mensagem recebida: ${errorMessage}`, errorStack);
    }
  }

  private async handleMessageSent(data: PlugzApiWebhookData) {
    try {
      const messageId = data.id || data.messageId;
      if (messageId) {
        const message = await this.messagesResource.findByWhatsAppMessageId(messageId);
        if (message) {
          this.logger.log(`Mensagem enviada confirmada: ${messageId}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao processar mensagem enviada: ${errorMessage}`, errorStack);
    }
  }

  private async handleMessageStatus(data: PlugzApiWebhookData) {
    try {
      const messageId = data.id || data.messageId;
      const status = data.status;

      if (messageId) {
        const message = await this.messagesResource.findByWhatsAppMessageId(messageId);
        if (message) {
          this.logger.log(`Status da mensagem atualizado: ${messageId} - ${status}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao processar status: ${errorMessage}`, errorStack);
    }
  }

  private mapPlugzMessageType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      audio: MessageType.AUDIO,
      video: MessageType.VIDEO,
      document: MessageType.DOCUMENT,
    };
    return typeMap[type?.toLowerCase()] || MessageType.TEXT;
  }

  private async saveOutboundMessage(
    organizationId: string,
    phone: string,
    content: string,
    messageType: string,
    mediaUrl?: string,
    whatsappMessageId?: string,
  ) {
    try {
      let conversation = await this.conversationsResource.findByPhone(organizationId, phone);

      if (!conversation) {
        conversation = await this.conversationsResource.create({
          organizationId,
          whatsappPhoneNumber: phone,
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
        });
      }

      await this.messagesResource.create({
        conversationId: conversation.id,
        direction: MessageDirection.OUTBOUND,
        whatsappMessageId,
        content,
        messageType: this.mapPlugzMessageType(messageType),
        mediaUrl,
      });

      await this.conversationsResource.save({
        ...conversation,
        lastMessageAt: new Date(),
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao salvar mensagem: ${errorMessage}`, errorStack);
    }
  }

  async getConversations(organizationId: string) {
    try {
      const url = `${this.baseUrl}/chats/get-chats`;
      this.logger.log(`Buscando conversas para organização ${organizationId}`);

      const response = await firstValueFrom(
        this.httpService.get<PlugzApiResponse>(url, {
          headers: this.getHeaders(),
        }),
      );

      if (response.data.success && response.data.data) {
        const chats: PlugzApiChat[] = Array.isArray(response.data.data)
          ? (response.data.data as PlugzApiChat[])
          : [response.data.data as PlugzApiChat];

        const conversations: Conversation[] = [];
        for (const chat of chats) {
          const phone = chat.id || chat.phone || chat.phoneNumber;
          if (!phone) continue;

          let conversation = await this.conversationsResource.findByPhone(
            organizationId,
            this.formatPhoneNumber(phone),
          );

          if (!conversation) {
            conversation = await this.conversationsResource.create({
              organizationId,
              whatsappPhoneNumber: this.formatPhoneNumber(phone),
              contactName: chat.name || chat.contactName || null,
              status: ConversationStatus.ACTIVE,
              metadata: {
                unreadCount: chat.unreadCount || 0,
                lastMessage: chat.lastMessage || null,
              },
              lastMessageAt: chat.timestamp ? new Date(chat.timestamp * 1000) : new Date(),
            });
          } else {
            await this.conversationsResource.save({
              ...conversation,
              contactName: chat.name || chat.contactName || conversation.contactName,
              metadata: {
                ...conversation.metadata,
                unreadCount: chat.unreadCount || 0,
                lastMessage: chat.lastMessage || null,
              },
              lastMessageAt: chat.timestamp
                ? new Date(chat.timestamp * 1000)
                : conversation.lastMessageAt,
            });
            conversation = await this.conversationsResource.findOne(conversation.id, ['messages']);
          }

          if (conversation) {
            conversations.push(conversation);
          }
        }

        return conversations;
      }

      return this.conversationsResource.findByOrganization(organizationId, ['messages']);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao buscar conversas: ${errorMessage}`, errorStack);
      return this.conversationsResource.findByOrganization(organizationId, ['messages']);
    }
  }

  async getChatMessages(organizationId: string, phone: string) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const url = `${this.baseUrl}/chats/get-message-chats`;
      this.logger.log(`Buscando mensagens do chat ${formattedPhone}`);

      let conversation = await this.conversationsResource.findByPhone(
        organizationId,
        formattedPhone,
      );

      const response = await firstValueFrom(
        this.httpService.get<PlugzApiResponse>(url, {
          headers: this.getHeaders(),
          params: {
            phone: formattedPhone,
          },
        }),
      );

      if (response.data.success && response.data.data) {
        const messages: PlugzApiMessage[] = Array.isArray(response.data.data)
          ? (response.data.data as PlugzApiMessage[])
          : [response.data.data as PlugzApiMessage];

        if (!conversation) {
          conversation = await this.conversationsResource.create({
            organizationId,
            whatsappPhoneNumber: formattedPhone,
            status: ConversationStatus.ACTIVE,
            lastMessageAt: new Date(),
          });
        }

        for (const msg of messages) {
          const existingMessage = await this.messagesResource.findByWhatsAppMessageId(
            msg.id || msg.messageId,
          );

          if (!existingMessage && conversation) {
            await this.messagesResource.create({
              conversationId: conversation.id,
              direction: msg.fromMe ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
              whatsappMessageId: msg.id || msg.messageId,
              content: msg.body || msg.message || msg.text || '',
              messageType: this.mapPlugzMessageType(msg.type),
              mediaUrl: msg.mediaUrl || msg.url || null,
            });
          }
        }
      }

      if (conversation) {
        return this.messagesResource.findByConversation(conversation.id, { createdAt: 'ASC' });
      }

      return [];
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`Erro ao buscar mensagens: ${errorMessage}`, errorStack);
      return [];
    }
  }
}
