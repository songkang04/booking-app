import mongoose, { Schema, Document } from 'mongoose';

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

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  homestayId: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  verificationToken?: string;
  verificationOtp?: string; // Mã OTP 6 số để xác thực booking
  otpExpires?: Date; // Thời gian hết hạn OTP
  expiryDate?: Date;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paymentQrCode?: string;
  paymentDate?: Date;
  paymentVerifiedBy?: mongoose.Types.ObjectId;
  paymentVerifiedAt?: Date;
  paymentConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
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
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    guestCount: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    notes: String,
    verificationToken: String,
    verificationOtp: String, // Mã OTP 6 số
    otpExpires: Date, // Thời gian hết hạn OTP
    expiryDate: Date,
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: String,
    paymentReference: String,
    paymentQrCode: String,
    paymentDate: Date,
    paymentVerifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentVerifiedAt: Date,
    paymentConfirmedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ homestayId: 1, status: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
