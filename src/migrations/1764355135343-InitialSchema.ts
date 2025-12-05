import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1764355135343 implements MigrationInterface {
  name = 'InitialSchema1764355135343';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'agent', 'user', 'read_only')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying, "last_name" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, "email_verified_at" TIMESTAMP, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_organizations_role_enum" AS ENUM('owner', 'admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "role" "public"."user_organizations_role_enum" NOT NULL DEFAULT 'member', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f143fa57706c0fb840301ad7049" UNIQUE ("user_id", "organization_id"), CONSTRAINT "PK_51ed3f60fdf013ee5041d2d4d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document_id" uuid NOT NULL, "chunk_index" integer NOT NULL, "content" text NOT NULL, "token_count" integer, "page_number" integer, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2a33856c811764d7ed06a05b633" UNIQUE ("document_id", "chunk_index"), CONSTRAINT "PK_7f9060084e9b872dbb567193978" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_status_enum" AS ENUM('uploaded', 'processing', 'processed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "agent_id" uuid, "filename" character varying NOT NULL, "original_filename" character varying NOT NULL, "file_type" character varying NOT NULL, "file_size" bigint NOT NULL, "s3_key" character varying NOT NULL, "s3_bucket" character varying NOT NULL, "mime_type" character varying, "status" "public"."documents_status_enum" NOT NULL DEFAULT 'uploaded', "metadata" jsonb NOT NULL DEFAULT '{}', "processing_error" text, "chunk_count" integer NOT NULL DEFAULT '0', "version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "processed_at" TIMESTAMP, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying NOT NULL, "avatar_url" character varying, "system_prompt" text, "llm_model" character varying NOT NULL DEFAULT 'gpt-4o', "temperature" numeric(3,2) NOT NULL DEFAULT '0.7', "max_tokens" integer NOT NULL DEFAULT '1000', "is_active" boolean NOT NULL DEFAULT true, "whatsapp_phone_number" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'past_due', 'trialing')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "stripe_subscription_id" character varying NOT NULL, "stripe_customer_id" character varying NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL, "plan_id" character varying NOT NULL, "current_period_start" TIMESTAMP NOT NULL, "current_period_end" TIMESTAMP NOT NULL, "cancel_at_period_end" boolean NOT NULL DEFAULT false, "canceled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3a2d09d943f39912a01831a9272" UNIQUE ("stripe_subscription_id"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_subscription_tier_enum" AS ENUM('free', 'pro', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_subscription_status_enum" AS ENUM('active', 'inactive', 'canceled', 'past_due')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "api_key_hash" character varying, "subscription_tier" "public"."organizations_subscription_tier_enum" NOT NULL DEFAULT 'free', "subscription_status" "public"."organizations_subscription_status_enum" NOT NULL DEFAULT 'inactive', "stripe_customer_id" character varying, "stripe_subscription_id" character varying, "max_documents" integer NOT NULL DEFAULT '10', "max_agents" integer NOT NULL DEFAULT '1', "max_monthly_messages" integer NOT NULL DEFAULT '100', "settings" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "UQ_832a542cc7a2fe87f71c77059d1" UNIQUE ("api_key_hash"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_status_enum" AS ENUM('active', 'archived', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "agent_id" uuid, "whatsapp_phone_number" character varying NOT NULL, "contact_name" character varying, "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'active', "metadata" jsonb NOT NULL DEFAULT '{}', "last_message_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_direction_enum" AS ENUM('inbound', 'outbound')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_message_type_enum" AS ENUM('text', 'image', 'document', 'audio')`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "direction" "public"."messages_direction_enum" NOT NULL, "whatsapp_message_id" character varying, "content" text NOT NULL, "message_type" "public"."messages_message_type_enum" NOT NULL DEFAULT 'text', "media_url" character varying, "is_from_rag" boolean NOT NULL DEFAULT false, "rag_sources" jsonb, "processing_time_ms" integer, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d690d71ec614c7c34aa102efde3" UNIQUE ("whatsapp_message_id"), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."webhook_events_source_enum" AS ENUM('stripe', 'whatsapp')`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" "public"."webhook_events_source_enum" NOT NULL, "event_type" character varying NOT NULL, "event_id" character varying, "payload" jsonb NOT NULL, "processed" boolean NOT NULL DEFAULT false, "processing_error" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "processed_at" TIMESTAMP, CONSTRAINT "UQ_eca7d9af1d5bb2184a201ed250d" UNIQUE ("event_id"), CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('paid', 'open', 'void', 'uncollectible')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "stripe_invoice_id" character varying NOT NULL, "amount" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'BRL', "status" "public"."invoices_status_enum" NOT NULL, "invoice_pdf_url" character varying, "hosted_invoice_url" character varying, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0ddf8494c8665a57c670287ccd6" UNIQUE ("stripe_invoice_id"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" ADD CONSTRAINT "FK_b371ff8bc1e4f65fc3d01420be5" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_69427761f37533ae7767601a64b" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_778dcd1b4c55179247170ae519f" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ADD CONSTRAINT "FK_28ac537f8c7bc3c96f7d1753ec4" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_9ea1509175fa294fc64d43a9fe6" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_87d9df8c99fb824a39c681ec332" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_9f32ead8384a1a92e073a7c006a" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_d4e095bcd100de447d3c27708f9" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_d4e095bcd100de447d3c27708f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_9f32ead8384a1a92e073a7c006a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_87d9df8c99fb824a39c681ec332"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_9ea1509175fa294fc64d43a9fe6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" DROP CONSTRAINT "FK_28ac537f8c7bc3c96f7d1753ec4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_778dcd1b4c55179247170ae519f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_69427761f37533ae7767601a64b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunks" DROP CONSTRAINT "FK_b371ff8bc1e4f65fc3d01420be5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb"`,
    );
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TABLE "webhook_events"`);
    await queryRunner.query(`DROP TYPE "public"."webhook_events_source_enum"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TYPE "public"."messages_message_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_direction_enum"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_subscription_tier_enum"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
    await queryRunner.query(`DROP TABLE "document_chunks"`);
    await queryRunner.query(`DROP TABLE "user_organizations"`);
    await queryRunner.query(`DROP TYPE "public"."user_organizations_role_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
