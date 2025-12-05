import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/users/user.entity';

@Injectable()
export class UsersResource {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findOne(id: string, relations?: string[]): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  async findByEmail(email: string, relations?: string[]): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations,
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('User not found');
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async save(entity: User): Promise<User> {
    return this.repository.save(entity);
  }
}

