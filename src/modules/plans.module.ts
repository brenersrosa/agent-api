import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansController } from '../controllers/plans.controller';
import { PlansService } from '../services/plans.service';
import { PlansResource } from '../resources/plans.resource';
import { Plan } from '../models/plans/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  controllers: [PlansController],
  providers: [PlansService, PlansResource],
  exports: [PlansService],
})
export class PlansModule {}

