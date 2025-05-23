import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, PaymentStatus } from '../schemas/booking.schema';

export class CreateBookingDto {
  @IsString({ message: 'Homestay ID không hợp lệ' })
  @IsNotEmpty({ message: 'Homestay ID không được để trống' })
  homestayId!: string;

  @Type(() => Date)
  @IsDate({ message: 'Ngày check-in không hợp lệ' })
  @IsNotEmpty({ message: 'Ngày check-in không được để trống' })
  checkInDate!: Date;

  @Type(() => Date)
  @IsDate({ message: 'Ngày check-out không hợp lệ' })
  @IsNotEmpty({ message: 'Ngày check-out không được để trống' })
  checkOutDate!: Date;

  @IsNumber({}, { message: 'Số lượng khách không hợp lệ' })
  @Min(1, { message: 'Số lượng khách phải ít nhất là 1' })
  @IsNotEmpty({ message: 'Số lượng khách không được để trống' })
  guestCount!: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus, { message: 'Trạng thái đặt phòng không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái đặt phòng không được để trống' })
  status!: BookingStatus;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

export class BookingResponseDto {
  id!: string;
  userId!: string;
  homestayId!: number;
  checkInDate!: Date;
  checkOutDate!: Date;
  guestCount!: number;
  totalPrice!: number;
  status!: BookingStatus;
  notes?: string;
  createdAt!: Date;
}

// DTO for updating payment status
export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái thanh toán không được để trống' })
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @IsString({ message: 'Mã tham chiếu thanh toán phải là chuỗi ký tự' })
  paymentReference?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

// DTO for payment verification by admin
export class VerifyPaymentDto {
  @IsNotEmpty({ message: 'ID đặt phòng không được để trống' })
  @IsUUID('4', { message: 'ID đặt phòng không hợp lệ' })
  bookingId!: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}

export class PaymentInfoResponseDto {
  id!: string;
  paymentStatus!: PaymentStatus;
  totalPrice!: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentQrCode?: string;
  paymentDate?: Date;
  paymentVerifiedAt?: Date;
}

export class BookingDetailsResponseDto extends BookingResponseDto {
  homestay!: {
    id: number;
    name: string;
    address: string;
    location: string;
    price: number;
    images: string[];
  };
  user!: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}
