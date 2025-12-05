import * as crypto from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../models/organizations/organization.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      return false; // Deixa JWT guard tentar
    }

    // Formato: org_{org_id}_{random_32_chars}
    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'org') {
      throw new UnauthorizedException('Invalid API key format');
    }

    const organizationId = parts[1];

    // Buscar organização e validar hash
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.apiKeyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Verificar hash
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    if (hash !== organization.apiKeyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Adicionar organização ao request
    request.apiKey = {
      organizationId: organization.id,
      organization: organization,
    };

    return true;
  }

  private extractApiKey(request: any): string | null {
    return (
      request.headers['x-api-key'] ||
      request.headers['authorization']?.replace('Bearer ', '') ||
      null
    );
  }
}
