import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { SendMessageDto } from '../dto/whatsapp/send-message.dto';
import { WebhookDto } from '../dto/whatsapp/webhook.dto';
import { WhatsAppService } from '../services/whatsapp.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook da PlugzAPI (público)' })
  @ApiBody({ type: WebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  async webhook(@Body() body: WebhookDto) {
    return this.whatsappService.handleWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensagem via WhatsApp' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Mensagem enviada com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async send(@Body() dto: SendMessageDto, @Request() req: AuthenticatedRequest) {
    return this.whatsappService.sendMessage({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar conversas do WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas retornada com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getConversations(@Request() req: AuthenticatedRequest) {
    return this.whatsappService.getConversations(req.user.organizationId);
  }
}
