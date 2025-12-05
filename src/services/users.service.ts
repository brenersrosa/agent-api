import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersResource } from '../resources/users.resource';
import { User } from '../models/users/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersResource: UsersResource) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersResource.findOne(id, [
      'organizations',
      'organizations.organization',
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateDto: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    return this.usersResource.update(id, { ...user, ...updateDto });
  }
}

