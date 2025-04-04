import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user';

export enum HomestayStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('homestays')
export class Homestay {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  ownerID!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ length: 100, nullable: true })
  location!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'simple-array', nullable: true })
  images!: string[];

  @Column({ type: 'simple-json', nullable: true })
  amenities!: string[];

  @Column({ type: 'text', nullable: true })
  cancellationPolicy!: string;

  @Column({
    type: 'enum',
    enum: HomestayStatus,
    default: HomestayStatus.ACTIVE,
  })
  status!: HomestayStatus;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'ownerID' })
  owner!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}