import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Primeiro nome', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Sobrenome', required: false })
  lastName?: string;

  @ApiProperty({ description: 'Role do usuário', required: false })
  role?: string;
}

export class OrganizationResponseDto {
  @ApiProperty({ description: 'ID da organização' })
  id: string;

  @ApiProperty({ description: 'Nome da organização' })
  name: string;

  @ApiProperty({ description: 'Slug da organização' })
  slug: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token para renovar o access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Dados do usuário',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Dados da organização (apenas no registro)',
    type: OrganizationResponseDto,
    required: false,
  })
  organization?: OrganizationResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: 'Access token JWT renovado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token renovado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'API key gerada (mostrada apenas uma vez)',
    example: 'ak_live_1234567890abcdef',
  })
  apiKey: string;

  @ApiProperty({
    description: 'ID da organização',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Mensagem informativa',
    example: 'API key generated. Store it securely, it will not be shown again.',
  })
  message: string;
}
