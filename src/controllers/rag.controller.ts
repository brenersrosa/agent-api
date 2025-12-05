import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { QueryDto } from '../dto/rag/query.dto';
import { RagService } from '../services/rag.service';

@ApiTags('rag')
@Controller('rag')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  @ApiOperation({ summary: 'Executar consulta RAG' })
  @ApiBody({ type: QueryDto })
  @ApiResponse({
    status: 200,
    description: 'Consulta RAG executada com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async query(@Body() dto: QueryDto, @Request() req: AuthenticatedRequest) {
    return this.ragService.query({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }
}
