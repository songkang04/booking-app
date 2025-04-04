import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultUsers1743191099219 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash passwords for default users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    // Insert admin user
    await queryRunner.query(`
      INSERT INTO users (firstName, lastName, email, password, role, isEmailVerified)
      VALUES ('Admin', 'User', 'admin@example.com', '${adminPassword}', 'admin', true)
    `);

    // Insert regular user
    await queryRunner.query(`
      INSERT INTO users (firstName, lastName, email, password, role, isEmailVerified)
      VALUES ('Regular', 'User', 'user@example.com', '${userPassword}', 'user', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete the default users
    await queryRunner.query(
      `DELETE FROM users WHERE email IN ('admin@example.com', 'user@example.com')`
    );
  }
}
