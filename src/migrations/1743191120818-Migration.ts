import { MigrationInterface, QueryRunner, TableColumn, Table } from 'typeorm';

export class AddResetPasswordFields1743191120818 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    // Kiểm tra cột resetPasswordToken
    const hasResetPasswordToken = table?.columns.find(
      column => column.name === 'resetPasswordToken'
    );
    if (!hasResetPasswordToken) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'resetPasswordToken',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    // Kiểm tra cột resetPasswordExpires
    const hasResetPasswordExpires = table?.columns.find(
      column => column.name === 'resetPasswordExpires'
    );
    if (!hasResetPasswordExpires) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'resetPasswordExpires',
          type: 'timestamp',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    const hasResetPasswordToken = table?.columns.find(
      column => column.name === 'resetPasswordToken'
    );
    if (hasResetPasswordToken) {
      await queryRunner.dropColumn('users', 'resetPasswordToken');
    }

    const hasResetPasswordExpires = table?.columns.find(
      column => column.name === 'resetPasswordExpires'
    );
    if (hasResetPasswordExpires) {
      await queryRunner.dropColumn('users', 'resetPasswordExpires');
    }
  }
}
