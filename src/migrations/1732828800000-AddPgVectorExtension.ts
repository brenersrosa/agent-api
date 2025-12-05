import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPgVectorExtension1732828800000 implements MigrationInterface {
  name = 'AddPgVectorExtension1732828800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Add embedding column to document_chunks
    await queryRunner.query(`ALTER TABLE "document_chunks" ADD COLUMN "embedding" vector(1536)`);

    // Create HNSW index for efficient vector search
    await queryRunner.query(
      `CREATE INDEX "idx_chunks_embedding_hnsw" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chunks_embedding_hnsw"`);

    // Drop embedding column
    await queryRunner.query(`ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "embedding"`);

    // Note: We don't drop the extension as it might be used by other tables
  }
}
