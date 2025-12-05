import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../models/organizations/organization.entity';
import { UserOrganization } from '../models/organizations/user-organization.entity';
import { OrganizationsController } from '../controllers/organizations.controller';
import { OrganizationsService } from '../services/organizations.service';
import { OrganizationsResource } from '../resources/organizations.resource';
import { UserOrganizationResource } from '../resources/user-organization.resource';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, UserOrganization])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsResource, UserOrganizationResource],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
