import mongoose, { Schema, Document } from 'mongoose';

export interface IAmenity {
  name: string;
  icon: string;
}

export interface IHomestay extends Document {
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  country: string;
  images: string[];
  price: number;
  capacity: number;
  bedroomCount: number;
  bathroomCount: number;
  amenities: string[];
  hostId: mongoose.Types.ObjectId;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const homestaySchema = new Schema<IHomestay>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'Việt Nam',
    },
    images: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    bedroomCount: {
      type: Number,
      required: true,
    },
    bathroomCount: {
      type: Number,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho tìm kiếm
homestaySchema.index({ name: 'text', description: 'text', city: 'text', province: 'text' });

export const Homestay = mongoose.model<IHomestay>('Homestay', homestaySchema);
