import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ConversationsResource } from '../resources/conversations.resource';
import { MessagesResource } from '../resources/messages.resource';
import { Conversation, ConversationStatus } from '../models/whatsapp/conversation.entity';
import { Message, MessageDirection, MessageType } from '../models/whatsapp/message.entity';

interface PlugzApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface PlugzApiWebhook {
  instance: string;
  event: string;
  data: any;
}

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
      this.configService.get<string>('PLUGZAPI_BASE_URL') ||
      'https://api.plugzapi.com.br';
    this.instanceId =
      this.configService.get<string>('PLUGZAPI_INSTANCE_ID') || '';
    this.token = this.configService.get<string>('PLUGZAPI_TOKEN') || '';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      apikey: this.token,
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    // Se não começar com código do país, assume Brasil (55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  }

  async sendMessage(params: SendMessageParams) {
    const { to, message, messageType, mediaUrl, delay } = params;
    const phone = this.formatPhoneNumber(to);

    try {
      let endpoint = '';
      let payload: any = {
        phone,
        delay: delay || 0,
      };

      switch (messageType) {
        case 'image':
          endpoint = '/message/send-message-image';
          payload = {
            ...payload,
            image: mediaUrl || message,
            caption: message,
          };
          break;
        case 'audio':
          endpoint = '/message/send-message-audio';
          payload = {
            ...payload,
            audio: mediaUrl || message,
          };
          break;
        case 'video':
          endpoint = '/message/send-message-video';
          payload = {
            ...payload,
            video: mediaUrl || message,
            caption: message,
          };
          break;
        case 'document':
          endpoint = '/message/send-message-document';
          payload = {
            ...payload,
            document: mediaUrl || message,
            fileName: message,
          };
          break;
        default:
          endpoint = '/message/send-message-text';
          payload = {
            ...payload,
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

      if (response.data.success) {
        const messageId = response.data.data?.messageId || response.data.data?.id;

        // Salvar mensagem no banco
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
    } catch (error: any) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`, error.stack);
      throw new Error(
        error.response?.data?.message || error.message || 'Erro ao enviar mensagem',
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
    } catch (error: any) {
      this.logger.error(`Erro ao processar webhook: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  private async handleIncomingMessage(data: any) {
    try {
      const phone = data.from || data.phone;
      const messageContent = data.body || data.message || data.text || '';
      const messageId = data.id || data.messageId;
      const messageType = this.mapPlugzMessageType(data.type);

      // Buscar ou criar conversa
      let conversation = await this.conversationsResource.findOneByPhone(phone);

      if (!conversation) {
        // Se não encontrar, criar uma nova (precisa de organizationId)
        // Por enquanto, vamos logar e não criar
        this.logger.warn(
          `Conversa não encontrada para ${phone}. Criar conversa requer organizationId.`,
        );
        return;
      }

      // Salvar mensagem recebida
      await this.messagesResource.create({
        conversationId: conversation.id,
        direction: MessageDirection.INBOUND,
        whatsappMessageId: messageId,
        content: messageContent,
        messageType,
        mediaUrl: data.mediaUrl || data.url || null,
      });

      // Atualizar última mensagem da conversa
      await this.conversationsResource.save({
        ...conversation,
        lastMessageAt: new Date(),
      });

      this.logger.log(`Mensagem recebida salva: ${messageId}`);
    } catch (error: any) {
      this.logger.error(
        `Erro ao processar mensagem recebida: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleMessageSent(data: any) {
    try {
      const messageId = data.id || data.messageId;
      if (messageId) {
        const message = await this.messagesResource.findByWhatsAppMessageId(messageId);
        if (message) {
          // Atualizar status se necessário
          this.logger.log(`Mensagem enviada confirmada: ${messageId}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Erro ao processar mensagem enviada: ${error.message}`, error.stack);
    }
  }

  private async handleMessageStatus(data: any) {
    try {
      const messageId = data.id || data.messageId;
      const status = data.status; // RECEIVED, READ, etc.

      if (messageId) {
        const message = await this.messagesResource.findByWhatsAppMessageId(messageId);
        if (message) {
          // Atualizar metadata com status
          this.logger.log(`Status da mensagem atualizado: ${messageId} - ${status}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Erro ao processar status: ${error.message}`, error.stack);
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
      // Buscar ou criar conversa
      let conversation = await this.conversationsResource.findByPhone(organizationId, phone);

      if (!conversation) {
        conversation = await this.conversationsResource.create({
          organizationId,
          whatsappPhoneNumber: phone,
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
        });
      }

      // Salvar mensagem
      await this.messagesResource.create({
        conversationId: conversation.id,
        direction: MessageDirection.OUTBOUND,
        whatsappMessageId,
        content,
        messageType: this.mapPlugzMessageType(messageType),
        mediaUrl,
      });

      // Atualizar última mensagem
      await this.conversationsResource.save({
        ...conversation,
        lastMessageAt: new Date(),
      });
    } catch (error: any) {
      this.logger.error(`Erro ao salvar mensagem: ${error.message}`, error.stack);
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
        const chats = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];

        // Sincronizar com banco de dados local
        const conversations = [];
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
              lastMessageAt: chat.timestamp
                ? new Date(chat.timestamp * 1000)
                : new Date(),
            });
          } else {
            // Atualizar dados
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

          conversations.push(conversation!);
        }

        return conversations;
      }

      // Se a API não retornar dados, retornar do banco local
      return this.conversationsResource.findByOrganization(organizationId, ['messages']);
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar conversas: ${error.message}`,
        error.stack,
      );
      // Em caso de erro, retornar do banco local
      return this.conversationsResource.findByOrganization(organizationId, ['messages']);
    }
  }

  async getChatMessages(organizationId: string, phone: string) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const url = `${this.baseUrl}/chats/get-message-chats`;
      this.logger.log(`Buscando mensagens do chat ${formattedPhone}`);

      // Buscar conversa local primeiro
      let conversation = await this.conversationsResource.findByPhone(organizationId, formattedPhone);

      const response = await firstValueFrom(
        this.httpService.get<PlugzApiResponse>(url, {
          headers: this.getHeaders(),
          params: {
            phone: formattedPhone,
          },
        }),
      );

      if (response.data.success && response.data.data) {
        const messages = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];

        // Criar conversa se não existir
        if (!conversation) {
          conversation = await this.conversationsResource.create({
            organizationId,
            whatsappPhoneNumber: formattedPhone,
            status: ConversationStatus.ACTIVE,
            lastMessageAt: new Date(),
          });
        }

        // Sincronizar mensagens
        for (const msg of messages) {
          const existingMessage = await this.messagesResource.findByWhatsAppMessageId(
            msg.id || msg.messageId,
          );

          if (!existingMessage) {
            await this.messagesResource.create({
              conversationId: conversation!.id,
              direction: msg.fromMe
                ? MessageDirection.OUTBOUND
                : MessageDirection.INBOUND,
              whatsappMessageId: msg.id || msg.messageId,
              content: msg.body || msg.message || msg.text || '',
              messageType: this.mapPlugzMessageType(msg.type),
              mediaUrl: msg.mediaUrl || msg.url || null,
            });
          }
        }
      }

      // Retornar mensagens do banco local
      if (conversation) {
        return this.messagesResource.findByConversation(conversation.id, { createdAt: 'ASC' });
      }

      return [];
    } catch (error: any) {
      this.logger.error(`Erro ao buscar mensagens: ${error.message}`, error.stack);
      return [];
    }
  }
}

