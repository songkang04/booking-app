import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, nullable: false })
  firstName!: string;

  @Column({ length: 100, nullable: false })
  lastName!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false, select: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken!: string;

  @Column({ nullable: true })
  emailVerificationExpires!: Date;

  @Column({ nullable: true })
  phoneNumber!: string;

  @Column({ nullable: true })
  profilePicture!: string;

  @Column({ nullable: true })
  resetPasswordToken!: string;

  @Column({ nullable: true })
  resetPasswordExpires!: Date;

  @Column({ nullable: true })
  lastPasswordResetRequest!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash the password if it has been modified
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
