import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentStatusFields1747600000000 implements MigrationInterface {
  name = 'AddPaymentStatusFields1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop constraint that limits payment_status to the current enum values
    await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "booking_payment_status_check"`);

    // Update enum with new values
    await queryRunner.query(`ALTER TYPE "public"."booking_payment_status_enum" RENAME TO "booking_payment_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."booking_payment_status_enum" AS ENUM('unpaid', 'pending', 'waiting_approval', 'pending_verification', 'paid', 'refunded')`);
    await queryRunner.query(`ALTER TABLE "booking" ALTER COLUMN "payment_status" TYPE "public"."booking_payment_status_enum" USING "payment_status"::"text"::"public"."booking_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."booking_payment_status_enum_old"`);

    // Add paymentConfirmedAt column
    await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN "payment_confirmed_at" TIMESTAMP`);

    // Update existing rows to use 'pending' instead of 'unpaid' for consistency with new flow
    await queryRunner.query(`UPDATE "booking" SET "payment_status" = 'pending' WHERE "payment_status" = 'unpaid'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove new column
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "payment_confirmed_at"`);

    // Revert enum changes
    await queryRunner.query(`ALTER TYPE "public"."booking_payment_status_enum" RENAME TO "booking_payment_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."booking_payment_status_enum" AS ENUM('unpaid', 'pending_verification', 'paid', 'refunded')`);
    await queryRunner.query(`ALTER TABLE "booking" ALTER COLUMN "payment_status" TYPE "public"."booking_payment_status_enum" USING "payment_status"::"text"::"public"."booking_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."booking_payment_status_enum_old"`);

    // Update records with new payment statuses to unpaid
    await queryRunner.query(`UPDATE "booking" SET "payment_status" = 'unpaid' WHERE "payment_status" = 'pending'`);
  }
}
