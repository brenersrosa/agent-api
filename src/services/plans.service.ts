import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PlansResource } from '../resources/plans.resource';
import { CreatePlanDto } from '../dto/plans/create-plan.dto';
import { UpdatePlanDto } from '../dto/plans/update-plan.dto';
import { BillingInterval, Plan } from '../models/plans/plan.entity';

@Injectable()
export class PlansService {
  constructor(private readonly plansResource: PlansResource) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    // Verificar se já existe um plano com o mesmo nome
    const existingPlan = await this.plansResource.findByName(createPlanDto.name);

    if (existingPlan) {
      throw new ConflictException(`Já existe um plano com o nome "${createPlanDto.name}"`);
    }

    // Se stripePriceId foi fornecido, verificar se é único
    if (createPlanDto.stripePriceId) {
      const existingStripePlan = await this.plansResource.findByStripePriceId(
        createPlanDto.stripePriceId,
      );

      if (existingStripePlan) {
        throw new ConflictException(
          `Já existe um plano com o stripe_price_id "${createPlanDto.stripePriceId}"`,
        );
      }
    }

    return this.plansResource.create({
      ...createPlanDto,
      currency: createPlanDto.currency || 'BRL',
      billingInterval: createPlanDto.billingInterval || BillingInterval.MONTHLY,
      features: createPlanDto.features || {},
      isActive: createPlanDto.isActive !== undefined ? createPlanDto.isActive : true,
    });
  }

  async findAll(): Promise<Plan[]> {
    return this.plansResource.findAll({ createdAt: 'DESC' });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansResource.findOne(id);

    if (!plan) {
      throw new NotFoundException(`Plano com ID "${id}" não encontrado`);
    }

    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    // Se o nome está sendo atualizado, verificar se não conflita com outro plano
    if (updatePlanDto.name && updatePlanDto.name !== plan.name) {
      const existingPlan = await this.plansResource.findByName(updatePlanDto.name);

      if (existingPlan) {
        throw new ConflictException(`Já existe um plano com o nome "${updatePlanDto.name}"`);
      }
    }

    // Se stripePriceId está sendo atualizado, verificar se não conflita
    if (updatePlanDto.stripePriceId && updatePlanDto.stripePriceId !== plan.stripePriceId) {
      const existingStripePlan = await this.plansResource.findByStripePriceId(
        updatePlanDto.stripePriceId,
      );

      if (existingStripePlan) {
        throw new ConflictException(
          `Já existe um plano com o stripe_price_id "${updatePlanDto.stripePriceId}"`,
        );
      }
    }

    return this.plansResource.update(id, updatePlanDto);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);

    // TODO: Verificar se há assinaturas ativas usando este plano antes de deletar
    // Por enquanto, apenas deleta o plano
    await this.plansResource.remove(plan);
  }
}

