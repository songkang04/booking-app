import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './user';
import { Homestay } from './homestay';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  PAYMENT_PENDING = 'payment_pending',
  RENTED = 'rented'
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  WAITING_APPROVAL = 'waiting_approval',
  PENDING_VERIFICATION = 'pending_verification',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: number;

  @Column()
  homestayId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Homestay)
  @JoinColumn({ name: 'homestayId' })
  homestay!: Homestay;

  @Column({ type: 'date' })
  checkInDate!: Date;

  @Column({ type: 'date' })
  checkOutDate!: Date;

  @Column()
  guestCount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING
  })
  status!: BookingStatus;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  verificationToken!: string;

  @Column({ nullable: true })
  expiryDate!: Date;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID
  })
  paymentStatus!: PaymentStatus;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  paymentMethod!: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  paymentReference!: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  paymentQrCode!: string;

  @Column({ nullable: true })
  paymentDate!: Date;

  @Column({ nullable: true })
  paymentVerifiedBy!: number;

  @Column({ nullable: true })
  paymentVerifiedAt!: Date;

  @Column({ nullable: true })
  paymentConfirmedAt!: Date;
}
