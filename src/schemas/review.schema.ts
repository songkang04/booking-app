import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  homestayId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    homestayId: {
      type: Schema.Types.ObjectId,
      ref: 'Homestay',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho hiệu suất truy vấn
reviewSchema.index({ homestayId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
