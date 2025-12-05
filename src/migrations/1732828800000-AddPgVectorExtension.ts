import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPgVectorExtension1732828800000 implements MigrationInterface {
  name = 'AddPgVectorExtension1732828800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vector');

    const columnInfo = await queryRunner.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'document_chunks' 
      AND column_name = 'embedding'
    `);

    if (columnInfo.length === 0) {
      await queryRunner.query('ALTER TABLE "document_chunks" ADD COLUMN "embedding" vector(1536)');
    } else if (columnInfo[0].udt_name !== 'vector') {
      await queryRunner.query(
        'ALTER TABLE "document_chunks" ALTER COLUMN "embedding" TYPE vector(1536) USING embedding::vector',
      );
    }

    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'document_chunks' 
        AND indexname = 'idx_chunks_embedding_hnsw'
      )
    `);

    if (!indexExists[0].exists) {
      await queryRunner.query(
        'CREATE INDEX "idx_chunks_embedding_hnsw" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64)',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chunks_embedding_hnsw"`);

    await queryRunner.query(`ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "embedding"`);
  }
}
