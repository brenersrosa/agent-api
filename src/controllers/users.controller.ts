import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import { User } from '../models/users/user.entity';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  updateProfile(@Request() req: AuthenticatedRequest, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateDto);
  }
}
