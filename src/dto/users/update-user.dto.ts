import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false, description: 'Primeiro nome do usuário' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false, description: 'Sobrenome do usuário' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false, description: 'Email do usuário' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
