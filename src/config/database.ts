import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../models/user';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'booking_app',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [User],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
