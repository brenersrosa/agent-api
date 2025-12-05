import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlanDto } from '../dto/plans/create-plan.dto';
import { PlanResponseDto } from '../dto/plans/plan-response.dto';
import { UpdatePlanDto } from '../dto/plans/update-plan.dto';
import { Plan } from '../models/plans/plan.entity';
import { PlansService } from '../services/plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os planos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos retornada com sucesso',
    type: [PlanResponseDto],
  })
  findAll(): Promise<Plan[]> {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiParam({ name: 'id', description: 'ID do plano' })
  @ApiResponse({
    status: 200,
    description: 'Plano retornado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  findOne(@Param('id') id: string): Promise<Plan> {
    return this.plansService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo plano (apenas admin)' })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({
    status: 201,
    description: 'Plano criado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Conflito: plano já existe' })
  create(@Body() createPlanDto: CreatePlanDto): Promise<Plan> {
    return this.plansService.create(createPlanDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar plano (apenas admin)' })
  @ApiParam({ name: 'id', description: 'ID do plano' })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({
    status: 200,
    description: 'Plano atualizado com sucesso',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Conflito: nome ou stripe_price_id já existe' })
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar plano (apenas admin)' })
  @ApiParam({ name: 'id', description: 'ID do plano' })
  @ApiResponse({ status: 200, description: 'Plano deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.plansService.remove(id);
  }
}

