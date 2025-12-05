import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { AuthService } from '../services/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiKeyResponseDto, AuthResponseDto, RefreshResponseDto } from '../dto/auth/auth-response.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RefreshDto } from '../dto/auth/refresh.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar novo usuário e organização' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário e organização criados com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Email ou organização já existe',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar API key para organização' })
  @ApiResponse({
    status: 200,
    description: 'API key gerada com sucesso',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  async generateApiKey(@Request() req: AuthenticatedRequest) {
    const organizationId = req.user.organizationId;
    const apiKey = await this.authService.generateApiKey(organizationId);
    return {
      apiKey,
      organizationId,
      message: 'API key generated. Store it securely, it will not be shown again.',
    };
  }
}
