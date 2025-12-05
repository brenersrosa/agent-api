import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationsResource } from '../resources/organizations.resource';
import { UserOrganizationResource } from '../resources/user-organization.resource';
import { Organization } from '../models/organizations/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsResource: OrganizationsResource,
    private readonly userOrganizationResource: UserOrganizationResource,
  ) {}

  async findByUser(userId: string): Promise<Organization[]> {
    const userOrgs = await this.userOrganizationResource.findByUser(userId, ['organization']);

    return userOrgs.map((uo) => uo.organization);
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationsResource.findOne(id, [
      'users',
      'agents',
      'documents',
    ]);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, updateDto: Partial<Organization>): Promise<Organization> {
    const organization = await this.findOne(id);
    return this.organizationsResource.update(id, { ...organization, ...updateDto });
  }
}

