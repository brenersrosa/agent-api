import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { UploadedFile } from '../common/interfaces/file.interface';
import { AgentsService } from '../services/agents.service';
import { AgentAvatarService } from '../services/agent-avatar.service';
import { CreateAgentDto } from '../dto/agents/create-agent.dto';
import { UpdateAgentDto } from '../dto/agents/update-agent.dto';
import { Agent } from '../models/agents/agent.entity';

@ApiTags('agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly agentAvatarService: AgentAvatarService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar agentes da organização' })
  @ApiResponse({
    status: 200,
    description: 'Lista de agentes retornada com sucesso',
    type: [Agent],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.agentsService.findByOrganization(req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo agente' })
  @ApiBody({ type: CreateAgentDto })
  @ApiResponse({
    status: 201,
    description: 'Agente criado com sucesso',
    type: Agent,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Request() req: AuthenticatedRequest, @Body() createDto: CreateAgentDto) {
    return this.agentsService.create(req.user.organizationId, createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar agente' })
  @ApiParam({ name: 'id', description: 'ID do agente' })
  @ApiBody({ type: UpdateAgentDto })
  @ApiResponse({
    status: 200,
    description: 'Agente atualizado com sucesso',
    type: Agent,
  })
  @ApiResponse({ status: 404, description: 'Agente não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAgentDto) {
    return this.agentsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover agente' })
  @ApiParam({ name: 'id', description: 'ID do agente' })
  @ApiResponse({ status: 200, description: 'Agente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Agente não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload de avatar do agente' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID do agente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagem do avatar (PNG, JPG, JPEG, WEBP, SVG)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar atualizado com sucesso',
    type: Agent,
  })
  @ApiResponse({ status: 400, description: 'Erro de validação (tipo de arquivo, tamanho)' })
  @ApiResponse({ status: 404, description: 'Agente não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Agente não pertence à sua organização' })
  async uploadAvatar(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Agent> {
    const agent = await this.agentsService.findOneWithOrganization(id, req.user.organizationId);

    const parts = req.parts();
    let file: UploadedFile | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        file = {
          fieldname: part.fieldname,
          originalname: part.filename || 'unknown',
          encoding: part.encoding,
          mimetype: part.mimetype,
          size: buffer.length,
          buffer: buffer,
        };
        break;
      }
    }

    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const oldAvatarUrl = agent.avatarUrl;

    const avatarUrl = await this.agentAvatarService.uploadAvatar(
      file,
      req.user.organizationId,
      id,
    );

    await this.agentAvatarService.deleteAvatar(oldAvatarUrl || '', req.user.organizationId, id);

    return this.agentsService.updateAvatarUrl(id, avatarUrl);
  }

  @Delete(':id/avatar')
  @ApiOperation({ summary: 'Remover avatar do agente' })
  @ApiParam({ name: 'id', description: 'ID do agente' })
  @ApiResponse({
    status: 200,
    description: 'Avatar removido com sucesso',
    type: Agent,
  })
  @ApiResponse({ status: 404, description: 'Agente não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Agente não pertence à sua organização' })
  async deleteAvatar(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<Agent> {
    const agent = await this.agentsService.findOneWithOrganization(id, req.user.organizationId);

    if (agent.avatarUrl) {
      await this.agentAvatarService.deleteAvatar(
        agent.avatarUrl,
        req.user.organizationId,
        id,
      );
    }

    return this.agentsService.updateAvatarUrl(id, null);
  }
}
