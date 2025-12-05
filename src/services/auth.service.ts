import * as crypto from 'node:crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersResource } from '../resources/users.resource';
import { OrganizationsResource } from '../resources/organizations.resource';
import { UserOrganizationResource } from '../resources/user-organization.resource';
import { OrganizationRole } from '../models/organizations/user-organization.entity';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersResource: UsersResource,
    private readonly organizationsResource: OrganizationsResource,
    private readonly userOrganizationResource: UserOrganizationResource,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Verificar se email já existe
    const existingUser = await this.usersResource.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    // Criar usuário
    const user = await this.usersResource.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    // Criar organização
    const slug = this.generateSlug(registerDto.organizationName);
    const organization = await this.organizationsResource.create({
      name: registerDto.organizationName,
      slug,
    });

    // Associar usuário à organização como owner
    await this.userOrganizationResource.create({
      userId: user.id,
      organizationId: organization.id,
      role: OrganizationRole.OWNER,
    });

    // Gerar tokens
    const tokens = await this.generateTokens(user.id, organization.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersResource.findByEmail(loginDto.email, [
      'organizations',
      'organizations.organization',
    ]);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Atualizar último login
    await this.usersResource.update(user.id, { lastLoginAt: new Date() });

    // Pegar primeira organização do usuário
    const userOrg = user.organizations?.[0];
    const organizationId = userOrg?.organizationId;

    const tokens = await this.generateTokens(user.id, organizationId);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      return await this.generateTokens(payload.sub, payload.organizationId);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateApiKey(organizationId: string): Promise<string> {
    const organization = await this.organizationsResource.findOne(organizationId);

    if (!organization) {
      throw new UnauthorizedException('Organization not found');
    }

    // Gerar chave: org_{org_id}_{random_32_chars}
    const randomPart = crypto.randomBytes(16).toString('hex');
    const apiKey = `org_${organizationId}_${randomPart}`;

    // Hash da chave
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Salvar hash
    await this.organizationsResource.update(organizationId, { apiKeyHash: hash });

    // Retornar chave plaintext (apenas uma vez)
    return apiKey;
  }

  private async generateTokens(userId: string, organizationId?: string) {
    const payload = {
      sub: userId,
      organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .normalize('NFD')
        // biome-ignore lint/suspicious/noMisleadingCharacterClass: Combining diacritics are removed after NFD normalization
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
  }
}

