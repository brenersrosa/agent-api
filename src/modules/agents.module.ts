import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from '../controllers/agents.controller';
import { AgentsService } from '../services/agents.service';
import { AgentsResource } from '../resources/agents.resource';
import { AgentAvatarService } from '../services/agent-avatar.service';
import { Agent } from '../models/agents/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agent])],
  controllers: [AgentsController],
  providers: [AgentsService, AgentsResource, AgentAvatarService],
  exports: [AgentsService],
})
export class AgentsModule {}
