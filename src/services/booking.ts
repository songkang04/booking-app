import { Booking, BookingStatus, PaymentStatus, IBooking } from '../schemas/booking.schema';
import { Homestay, IHomestay } from '../schemas/homestay.schema';
import { User, IUser } from '../schemas/user.schema';
import { Types } from 'mongoose';
import emailService from '../config/mail';

interface CreateBookingParams {
  homestayId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  notes?: string;
}

interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}

interface ConfirmPaymentParams {
  paymentMethod: string;
  paymentReference?: string;
}

class BookingService {
  async createBooking(userId: string, params: CreateBookingParams): Promise<IBooking> {
    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // Kiểm tra homestay tồn tại
    const homestay = await Homestay.findById(params.homestayId);
    if (!homestay) {
      throw new Error('Homestay không tồn tại');
    }

    // Kiểm tra số lượng khách
    if (params.guestCount > homestay.capacity) {
      throw new Error(`Homestay chỉ có thể chứa tối đa ${homestay.capacity} khách`);
    }

    // Kiểm tra homestay còn trống trong khoảng thời gian này
    const isAvailable = await this.checkHomestayAvailability(
      params.homestayId,
      params.checkInDate,
      params.checkOutDate
    );

    if (!isAvailable) {
      throw new Error('Homestay không còn trống trong khoảng thời gian này');
    }

    // Tính tổng số ngày
    const days = Math.ceil(
      (new Date(params.checkOutDate).getTime() - new Date(params.checkInDate).getTime())
      / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
      throw new Error('Ngày check-out phải sau ngày check-in');
    }

    // Tính tổng tiền
    const totalPrice = homestay.price * days;

    // Tạo mã đặt phòng theo format HDBK + 8 ký tự hex
    const bookingCode = 'HDBK' + Math.random().toString(16).substring(2, 10);

    // Tạo mã OTP 6 số để xác thực booking
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[BOOKING SERVICE] ✅ Đã tạo mã OTP xác thực booking: ${verificationOtp}`);

    // Thời gian hết hạn OTP (15 phút)
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 15);

    // Tạo đặt phòng mới
    const booking = new Booking({
      userId: new Types.ObjectId(userId),
      homestayId: new Types.ObjectId(params.homestayId),
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      guestCount: params.guestCount,
      totalPrice,
      notes: params.notes,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      verificationToken: bookingCode,
      verificationOtp: verificationOtp,
      otpExpires: otpExpires,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Hết hạn sau 24 giờ
    });

    await booking.save();

    // Gửi email OTP xác thực booking
    try {
      const emailSent = await emailService.sendBookingOtpEmail(user, verificationOtp, {
        homestayName: homestay.name,
        homestayAddress: homestay.address,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        guestCount: params.guestCount,
        totalPrice: totalPrice,
      });
      if (emailSent) {
        console.log(`[BOOKING SERVICE] ✅ Đã gửi email OTP xác thực booking cho: ${user.email}`);
      } else {
        console.error(`[BOOKING SERVICE] ❌ Không thể gửi email OTP cho: ${user.email}`);
      }
    } catch (error) {
      console.error(`[BOOKING SERVICE] ❌ Lỗi gửi email OTP:`, error);
    }

    // Populate thông tin liên quan
    return booking.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'homestayId', select: 'name address price images' }
    ]);
  }

  async getBookings(params: GetBookingsParams & { userId?: string }): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { userId, status, page = 1, limit = 10 } = params;
    const query: any = {};

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .populate('homestayId', 'name address price images'),
      Booking.countDocuments(query)
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async getBookingById(id: string): Promise<IBooking | null> {
    return Booking.findById(id)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'homestayId',
        select: 'name address price images hostId',
        populate: { path: 'hostId', select: '_id firstName lastName email' }
      });
  }

  async verifyBooking(token: string): Promise<IBooking> {
    const booking = await Booking.findOne({
      verificationToken: token,
      status: BookingStatus.PENDING
    });

    if (!booking) {
      throw new Error('Token không hợp lệ hoặc đặt phòng không tồn tại');
    }

    if (booking.expiryDate && booking.expiryDate < new Date()) {
      throw new Error('Token đã hết hạn');
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.verificationToken = undefined;
    booking.expiryDate = undefined;

    await booking.save();
    return booking.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'homestayId', select: 'name address price images' }
    ]);
  }

  /**
   * Xác thực booking bằng mã OTP 6 số
   */
  async verifyBookingOtp(bookingId: string, otp: string): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: new Types.ObjectId(bookingId),
      verificationOtp: otp,
      status: BookingStatus.PENDING
    });

    if (!booking) {
      throw new Error('Mã OTP không hợp lệ hoặc đặt phòng không tồn tại');
    }

    if (booking.otpExpires && booking.otpExpires < new Date()) {
      throw new Error('Mã OTP đã hết hạn');
    }

    // Cập nhật trạng thái booking sang CONFIRMED
    booking.status = BookingStatus.CONFIRMED;
    booking.verificationOtp = undefined;
    booking.otpExpires = undefined;

    await booking.save();

    // Gửi email thông báo đặt phòng thành công
    try {
      const user = await User.findById(booking.userId);
      const homestay = await Homestay.findById(booking.homestayId);

      if (user && homestay) {
        await emailService.sendBookingSuccessNotification(user, {
          homestayName: homestay.name,
          homestayAddress: homestay.address,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          guestCount: booking.guestCount,
          totalPrice: booking.totalPrice,
          bookingId: (booking._id as string).toString(),
        });
      }
    } catch (error) {
      console.error('[BOOKING SERVICE] ❌ Lỗi gửi email thông báo:', error);
    }

    return booking.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'homestayId', select: 'name address price images' }
    ]);
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    // Kiểm tra logic chuyển trạng thái
    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Không thể thay đổi trạng thái của đặt phòng đã hủy');
    }

    if (status === BookingStatus.CONFIRMED && booking.paymentStatus !== PaymentStatus.PAID) {
      throw new Error('Không thể xác nhận đặt phòng chưa thanh toán');
    }

    booking.status = status;
    await booking.save();

    return booking.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'homestayId', select: 'name address price images' }
    ]);
  }

  async confirmUserPayment(
    userId: string,
    bookingId: string,
    params: ConfirmPaymentParams
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    if (booking.userId.toString() !== userId) {
      throw new Error('Bạn không có quyền xác nhận thanh toán cho đặt phòng này');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error('Đặt phòng chưa được xác nhận');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Đặt phòng đã được thanh toán');
    }

    booking.paymentMethod = params.paymentMethod;
    booking.paymentReference = params.paymentReference;
    booking.paymentStatus = PaymentStatus.WAITING_APPROVAL;
    booking.paymentDate = new Date();

    await booking.save();

    return booking.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'homestayId', select: 'name address price images' }
    ]);
  }

  async getBookingsByStatus(status: BookingStatus): Promise<IBooking[]> {
    return Booking.find({ status })
      .populate('userId', 'firstName lastName email')
      .populate('homestayId', 'name address price images')
      .sort({ createdAt: -1 });
  }

  async getAllBookings(): Promise<IBooking[]> {
    return Booking.find({})
      .populate('userId', 'firstName lastName email')
      .populate('homestayId', 'name address price images')
      .sort({ createdAt: -1 });
  }

  async countBookingsByStatus(status: BookingStatus): Promise<number> {
    return Booking.countDocuments({ status });
  }

  async calculateTotalRevenue(): Promise<number> {
    const paidBookings = await Booking.find({
      paymentStatus: PaymentStatus.PAID
    });

    return paidBookings.reduce((total, booking) => total + booking.totalPrice, 0);
  }

  async getRecentPendingPayments(limit: number): Promise<IBooking[]> {
    return Booking.find({
      paymentStatus: PaymentStatus.WAITING_APPROVAL
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .populate('homestayId', 'name address price images');
  }

  async getBookingsWithPaymentStatus(paymentStatus: PaymentStatus): Promise<IBooking[]> {
    return Booking.find({ paymentStatus })
      .populate('userId', 'firstName lastName email')
      .populate('homestayId', 'name address price images')
      .sort({ createdAt: -1 });
  }

  async adminUpdateBookingStatus(id: string, status: BookingStatus, notes?: string): Promise<IBooking> {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    // Validate status transition
    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Không thể thay đổi trạng thái của đặt phòng đã hủy');
    }

    // Update status and notes
    booking.status = status;
    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    return booking.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'homestayId', select: 'name address price images' }
    ]);
  }

  private async checkHomestayAvailability(
    homestayId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    const overlappingBookings = await Booking.find({
      homestayId: new Types.ObjectId(homestayId),
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      $or: [
        {
          checkInDate: { $lte: new Date(checkInDate) },
          checkOutDate: { $gt: new Date(checkInDate) },
        },
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkOutDate) },
        },
        {
          checkInDate: { $gte: new Date(checkInDate) },
          checkOutDate: { $lte: new Date(checkOutDate) },
        },
      ],
    });

    return overlappingBookings.length === 0;
  }
}

export default new BookingService();
