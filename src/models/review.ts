import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user';
import { Homestay } from './homestay';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  homestayId!: number;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating!: number;

  @Column({ type: 'text' })
  comment!: string;

  @Column({ type: 'text', nullable: true })
  response?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Homestay)
  @JoinColumn({ name: 'homestayId' })
  homestay!: Homestay;
}
