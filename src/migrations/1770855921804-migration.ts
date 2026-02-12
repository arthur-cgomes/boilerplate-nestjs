import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1770855921804 implements MigrationInterface {
  name = 'Migration1770855921804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_usertype_enum" AS ENUM('user', 'global', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_authprovider_enum" AS ENUM('local', 'google', 'microsoft', 'facebook', 'github')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "email" character varying NOT NULL, "password" character varying, "name" character varying, "userType" "public"."user_usertype_enum" NOT NULL DEFAULT 'user', "firstLogin" TIMESTAMP, "lastLogin" TIMESTAMP, "authProvider" "public"."user_authprovider_enum" NOT NULL DEFAULT 'local', "providerId" character varying, "avatarUrl" character varying, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_843f46779f60b45032874be95b" ON "user" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c396c7c2501d124ea4feccab8b" ON "user" ("active", "email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ad4792ebd254550ad4fdb55d6" ON "user" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "token" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "sessionId" uuid, "deviceInfo" character varying, "userAgent" character varying, "ipAddress" character varying, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b76d50d120eefffc825d1c72e7" ON "refresh_token" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e54266640b2a0ef53d507461f3" ON "refresh_token" ("userId", "revoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be10ceff612aafc44491d6cb52" ON "refresh_token" ("token", "revoked", "expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ad962c903c72d82e7d4f29dbf" ON "refresh_token" ("revoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f310b2b1f45ec02710a719361" ON "refresh_token" ("sessionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c03a9271901099da2a840b0312" ON "refresh_token" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c31d0a2f38e6e99110df62ab0a" ON "refresh_token" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e913e288156c133999341156a" ON "refresh_token" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feature_flag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "key" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "conditions" jsonb, "rolloutPercentage" integer NOT NULL DEFAULT '100', "allowedUserIds" text, "allowedUserTypes" text, "allowedEnvironments" text, "startDate" TIMESTAMP, "endDate" TIMESTAMP, CONSTRAINT "UQ_960310efa932f7a29eec57350b3" UNIQUE ("key"), CONSTRAINT "PK_f390205410d884907604a90c0f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_731d2c87924c461852cb91306f" ON "feature_flag" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_960310efa932f7a29eec57350b" ON "feature_flag" ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "token" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_838af121380dfe3a6330e04f5bb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f759be3d4ba64b75beb578ccbe" ON "password_reset_token" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2266c064e62e71e38ec15fe035" ON "password_reset_token" ("token", "used", "expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5a7066bc0a5bcf4b1f3b906f6e" ON "password_reset_token" ("used") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_387c1a80b2be5227eeda9fa350" ON "password_reset_token" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c50e3a3bee2912c1153c63aa6" ON "password_reset_token" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4e53583f7a8ab7d01cded46a4" ON "password_reset_token" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "file_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "fileName" character varying NOT NULL, "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "path" character varying NOT NULL, "url" character varying NOT NULL, "bucket" character varying NOT NULL, "uploadedById" uuid NOT NULL, CONSTRAINT "PK_16ca009355a1f732909b3ff477b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_745626e0d55d1cbfe80a34c55a" ON "file_record" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_175ad7e86e41e807d940c90bd2" ON "file_record" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13739ae1827a5728ce616d3bda" ON "file_record" ("uploadedById") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "userId" uuid, "entityName" character varying(100) NOT NULL, "entityId" uuid NOT NULL, "action" "public"."audit_log_action_enum" NOT NULL, "oldValue" jsonb, "newValue" jsonb, "changedFields" jsonb, "ipAddress" character varying(255), "userAgent" character varying(500), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cf627ebebe567a412fe2f7b4fd" ON "audit_log" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59cb40bbe2a3e5523c1fbb9941" ON "audit_log" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_951e6339a77994dfbad976b35c" ON "audit_log" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78e013ffae12f5a1fc1dbefff9" ON "audit_log" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2621409ebc295c5da7ff3e4139" ON "audit_log" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78c9f2ddaf1006b8353826fbcb" ON "audit_log" ("entityName", "entityId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "login_attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deleteAt" TIMESTAMP, "active" boolean NOT NULL DEFAULT true, "createdBy" character varying, "createdById" character varying, "updatedBy" character varying, "updatedById" character varying, "email" character varying NOT NULL, "ipAddress" character varying, "userAgent" character varying, "successful" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_72829cd4f7424e3cdfd46c476c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f4b1710ddc6aeafee99623d82" ON "login_attempt" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_19dfe1c5a444c6a413a4bad3a8" ON "login_attempt" ("ipAddress") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c8f37ecddbd770081c41696272" ON "login_attempt" ("email", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_token" ADD CONSTRAINT "FK_a4e53583f7a8ab7d01cded46a41" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log" ADD CONSTRAINT "FK_2621409ebc295c5da7ff3e41396" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_log" DROP CONSTRAINT "FK_2621409ebc295c5da7ff3e41396"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_token" DROP CONSTRAINT "FK_a4e53583f7a8ab7d01cded46a41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c8f37ecddbd770081c41696272"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_19dfe1c5a444c6a413a4bad3a8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f4b1710ddc6aeafee99623d82"`,
    );
    await queryRunner.query(`DROP TABLE "login_attempt"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78c9f2ddaf1006b8353826fbcb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2621409ebc295c5da7ff3e4139"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78e013ffae12f5a1fc1dbefff9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_951e6339a77994dfbad976b35c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59cb40bbe2a3e5523c1fbb9941"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cf627ebebe567a412fe2f7b4fd"`,
    );
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TYPE "public"."audit_log_action_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13739ae1827a5728ce616d3bda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_175ad7e86e41e807d940c90bd2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_745626e0d55d1cbfe80a34c55a"`,
    );
    await queryRunner.query(`DROP TABLE "file_record"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4e53583f7a8ab7d01cded46a4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c50e3a3bee2912c1153c63aa6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_387c1a80b2be5227eeda9fa350"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5a7066bc0a5bcf4b1f3b906f6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2266c064e62e71e38ec15fe035"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f759be3d4ba64b75beb578ccbe"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_960310efa932f7a29eec57350b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_731d2c87924c461852cb91306f"`,
    );
    await queryRunner.query(`DROP TABLE "feature_flag"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e913e288156c133999341156a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c31d0a2f38e6e99110df62ab0a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c03a9271901099da2a840b0312"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f310b2b1f45ec02710a719361"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ad962c903c72d82e7d4f29dbf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be10ceff612aafc44491d6cb52"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e54266640b2a0ef53d507461f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b76d50d120eefffc825d1c72e7"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ad4792ebd254550ad4fdb55d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c396c7c2501d124ea4feccab8b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_843f46779f60b45032874be95b"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_authprovider_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_usertype_enum"`);
  }
}
