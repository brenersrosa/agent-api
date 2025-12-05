import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { AgentsService } from '../services/agents.service';
import { CreateAgentDto } from '../dto/agents/create-agent.dto';
import { UpdateAgentDto } from '../dto/agents/update-agent.dto';
import { Agent } from '../models/agents/agent.entity';

@ApiTags('agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

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
}
