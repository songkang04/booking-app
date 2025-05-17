import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFields1744191099220 implements MigrationInterface {
    name = 'AddPaymentFields1744191099220';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // MySQL uses ENUM directly in column definitions instead of separate types

        // Thêm các cột liên quan đến thanh toán
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentStatus ENUM('unpaid', 'pending_verification', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid'`);
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentMethod VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentReference VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentQrCode VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentDate DATETIME`);
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentVerifiedBy INT`);
        await queryRunner.query(`ALTER TABLE booking ADD COLUMN paymentVerifiedAt DATETIME`);

        // MySQL doesn't support adding values to an existing ENUM
        // We need to modify the column to include the new values
        await queryRunner.query(`ALTER TABLE booking MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'payment_pending', 'rented') NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa các cột thanh toán
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentVerifiedAt`);
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentVerifiedBy`);
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentDate`);
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentQrCode`);
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentReference`);
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentMethod`);
        await queryRunner.query(`ALTER TABLE booking DROP COLUMN paymentStatus`);

        // Revert status column to original values
        await queryRunner.query(`ALTER TABLE booking MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending'`);
    }
}
