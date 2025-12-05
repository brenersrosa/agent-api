import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlansTable1764355200000 implements MigrationInterface {
  name = 'CreatePlansTable1764355200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."plans_billing_interval_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "stripe_price_id" character varying, "price" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'BRL', "billing_interval" "public"."plans_billing_interval_enum" NOT NULL DEFAULT 'monthly', "max_documents" integer NOT NULL, "max_agents" integer NOT NULL, "max_monthly_messages" integer NOT NULL, "features" jsonb NOT NULL DEFAULT '{}', "trial_days" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_plans_name" UNIQUE ("name"), CONSTRAINT "UQ_plans_stripe_price_id" UNIQUE ("stripe_price_id"), CONSTRAINT "PK_plans_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plans_name" ON "plans" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plans_is_active" ON "plans" ("is_active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_plans_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_plans_name"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TYPE "public"."plans_billing_interval_enum"`);
  }
}

