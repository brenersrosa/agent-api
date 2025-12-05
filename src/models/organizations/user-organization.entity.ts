import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Organization } from './organization.entity';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('user_organizations')
@Unique(['userId', 'organizationId'])
export class UserOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  role: OrganizationRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
