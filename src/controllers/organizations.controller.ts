import { Body, Controller, Get, Param, Put, Request, UseGuards } from '@nestjs/common';
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
import { UpdateOrganizationDto } from '../dto/organizations/update-organization.dto';
import { Organization } from '../models/organizations/organization.entity';
import { OrganizationsService } from '../services/organizations.service';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar organizações do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de organizações retornada com sucesso',
    type: [Organization],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.organizationsService.findByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter organização por ID' })
  @ApiParam({ name: 'id', description: 'ID da organização' })
  @ApiResponse({
    status: 200,
    description: 'Organização retornada com sucesso',
    type: Organization,
  })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar organização' })
  @ApiParam({ name: 'id', description: 'ID da organização' })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: 'Organização atualizada com sucesso',
    type: Organization,
  })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, updateDto);
  }
}
