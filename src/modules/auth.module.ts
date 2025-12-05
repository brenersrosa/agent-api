import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../models/organizations/organization.entity';
import { UserOrganization } from '../models/organizations/user-organization.entity';
import { User } from '../models/users/user.entity';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersResource } from '../resources/users.resource';
import { OrganizationsResource } from '../resources/organizations.resource';
import { UserOrganizationResource } from '../resources/user-organization.resource';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, UserOrganization]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersResource, OrganizationsResource, UserOrganizationResource, JwtStrategy, JwtAuthGuard, ApiKeyGuard],
  exports: [AuthService, JwtAuthGuard, ApiKeyGuard],
})
export class AuthModule {}
