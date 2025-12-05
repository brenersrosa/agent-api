import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../services/admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dados do dashboard administrativo' })
  @ApiResponse({
    status: 200,
    description: 'Dados do dashboard retornados com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Post('documents/:id/reindex')
  @ApiOperation({ summary: 'Reindexar documento' })
  @ApiParam({ name: 'id', description: 'ID do documento' })
  @ApiResponse({
    status: 200,
    description: 'Documento reindexado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  reindexDocument(@Param('id') id: string) {
    return this.adminService.reindexDocument(id);
  }
}
