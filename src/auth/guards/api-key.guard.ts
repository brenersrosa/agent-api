import * as crypto from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FastifyRequest } from 'fastify';
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
      return false;
    }

    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'org') {
      throw new UnauthorizedException('Invalid API key format');
    }

    const organizationId = parts[1];

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.apiKeyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    if (hash !== organization.apiKeyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiKey = {
      organizationId: organization.id,
      organization: organization,
    };

    return true;
  }

  private extractApiKey(request: FastifyRequest): string | null {
    const apiKeyHeader = request.headers['x-api-key'];
    const authHeader = request.headers.authorization;

    if (typeof apiKeyHeader === 'string') {
      return apiKeyHeader;
    }

    if (typeof authHeader === 'string') {
      return authHeader.replace('Bearer ', '');
    }

    return null;
  }
}
