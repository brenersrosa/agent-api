import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../models/users/user.entity';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { UsersResource } from '../resources/users.resource';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersResource],
  exports: [UsersService],
})
export class UsersModule {}
