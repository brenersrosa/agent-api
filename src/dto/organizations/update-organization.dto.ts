import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiProperty({ required: false, description: 'Nome da organização' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Configurações da organização',
    type: 'object',
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
