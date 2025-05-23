import { HomestayStatus } from '../models/homestay';

export interface CreateHomestayDto {
  name: string;
  address: string;
  location?: string;
  price: number;
  description?: string;
  images?: string[];
  amenities?: string[];
  cancellationPolicy?: string;
  status?: HomestayStatus;
}

export interface UpdateHomestayDto {
  name?: string;
  address?: string;
  location?: string;
  price?: number;
  description?: string;
  images?: string[];
  amenities?: string[];
  cancellationPolicy?: string;
  status?: HomestayStatus;
}

export interface HomestaySearchParams {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  name?: string;
  amenities?: string[];
  status?: HomestayStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}