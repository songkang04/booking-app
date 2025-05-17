import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Booking, BookingStatus, PaymentStatus } from '../models/booking';
import { User } from '../models/user';
import { Homestay } from '../models/homestay';
import { CreateBookingDto, UpdateBookingStatusDto, UpdatePaymentStatusDto } from '../dtos/booking.dto';
import crypto from 'crypto';
import emailService from '../config/mail';
import paymentService from './payment';

export class BookingService {
  private bookingRepository: Repository<Booking>;
  private userRepository: Repository<User>;
  private homestayRepository: Repository<Homestay>;

  constructor() {
    this.bookingRepository = AppDataSource.getRepository(Booking);
    this.userRepository = AppDataSource.getRepository(User);
    this.homestayRepository = AppDataSource.getRepository(Homestay);
  }

  /**
   * Tạo đặt phòng mới và gửi email xác nhận
   */
  async createBooking(
    userId: number,
    createBookingDto: CreateBookingDto
  ): Promise<Booking> {
    // Kiểm tra người dùng tồn tại
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // Kiểm tra homestay tồn tại
    const homestayId = createBookingDto.homestayId;
    const homestay = await this.homestayRepository.findOneBy({
      id: homestayId,
    });
    if (!homestay) {
      throw new Error('Homestay không tồn tại');
    }

    // Kiểm tra ngày check-in phải trước ngày check-out
    if (createBookingDto.checkInDate >= createBookingDto.checkOutDate) {
      throw new Error('Ngày check-in phải trước ngày check-out');
    }

    // Kiểm tra ngày check-in phải từ hôm nay trở đi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(createBookingDto.checkInDate) < today) {
      throw new Error('Ngày check-in phải từ hôm nay trở đi');
    }

    // Kiểm tra thời gian đặt phòng không quá 365 ngày (1 năm)
    const checkInDate = new Date(createBookingDto.checkInDate);
    const checkOutDate = new Date(createBookingDto.checkOutDate);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      throw new Error('Thời gian đặt phòng không được quá 365 ngày');
    }

    // Tính tổng giá tiền và đảm bảo không vượt quá giới hạn của decimal(10,2)
    const maxPrice = 99999999.99; // Giới hạn của decimal(10,2) là 8 chữ số phần nguyên và 2 chữ số phần thập phân
    const basePrice = homestay.price * diffDays;
    const totalPrice = Math.min(basePrice, maxPrice);

    // Tạo token xác nhận
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // Hết hạn sau 24 giờ

    // Tạo đặt phòng mới
    const booking = new Booking();
    booking.userId = userId;
    booking.homestayId = homestayId;
    booking.checkInDate = checkInDate;
    booking.checkOutDate = checkOutDate;
    booking.guestCount = createBookingDto.guestCount;
    booking.totalPrice = totalPrice;
    booking.status = BookingStatus.PENDING;
    booking.notes = createBookingDto.notes || '';
    booking.verificationToken = verificationToken;
    booking.expiryDate = expiryDate;

    // Lưu đặt phòng
    const savedBooking = await this.bookingRepository.save(booking);
    console.log("🚀 ~ BookingService ~ savedBooking:", savedBooking)

    // Gửi email xác nhận
    await emailService.sendBookingConfirmation(user, verificationToken, {
      homestayName: homestay.name,
      homestayAddress: homestay.address + (homestay.location ? ', ' + homestay.location : ''),
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      guestCount: createBookingDto.guestCount,
      totalPrice: totalPrice,
    });

    return savedBooking;
  }

  /**
   * Lấy danh sách đặt phòng của người dùng
   */
  async getUserBookings(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId },
      relations: ['homestay'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy chi tiết đặt phòng
   */
  async getBookingById(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['homestay', 'user'],
    });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    return booking;
  }

  /**
   * Xác nhận đặt phòng
   */
  async verifyBooking(token: string): Promise<Booking> {
    // Tìm đặt phòng theo token và chưa hết hạn
    const now = new Date();
    const booking = await this.bookingRepository.findOne({
      where: {
        verificationToken: token,
        expiryDate: MoreThan(now),
        status: BookingStatus.PENDING,
      },
      relations: ['homestay', 'user'],
    });

    if (!booking) {
      throw new Error(
        'Token không hợp lệ hoặc đã hết hạn hoặc đặt phòng đã được xác nhận'
      );
    }

    // Cập nhật trạng thái đặt phòng thành CONFIRMED
    booking.status = BookingStatus.CONFIRMED;
    booking.verificationToken = ''; // Xóa token sau khi xác nhận
    const updatedBooking = await this.bookingRepository.save(booking);

    // Gửi email thông báo đặt phòng thành công
    await emailService.sendBookingSuccessNotification(booking.user, {
      homestayName: booking.homestay.name,
      homestayAddress: booking.homestay.address + (booking.homestay.location ? ', ' + booking.homestay.location : ''),
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guestCount: booking.guestCount,
      totalPrice: booking.totalPrice,
      bookingId: booking.id,
    });

    // Tạo thông tin thanh toán và mã QR cho đặt phòng
    try {
      const bookingWithPayment = await paymentService.generatePaymentInfo(updatedBooking.id);
      return bookingWithPayment;
    } catch (error) {
      console.error('Lỗi khi tạo thông tin thanh toán:', error);
      return updatedBooking;
    }
  }

  /**
   * Cập nhật trạng thái đặt phòng
   */
  async updateBookingStatus(
    bookingId: string,
    updateStatusDto: UpdateBookingStatusDto
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOneBy({ id: bookingId });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    booking.status = updateStatusDto.status;
    return this.bookingRepository.save(booking);
  }

  /**
   * Cập nhật trạng thái thanh toán
   */
  async updatePaymentStatus(
    bookingId: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOneBy({ id: bookingId });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    booking.paymentStatus = updatePaymentStatusDto.paymentStatus;

    if (updatePaymentStatusDto.paymentReference) {
      booking.paymentReference = updatePaymentStatusDto.paymentReference;
    }

    if (updatePaymentStatusDto.notes) {
      booking.notes = booking.notes
        ? `${booking.notes}\n\nCập nhật thanh toán: ${updatePaymentStatusDto.notes}`
        : `Cập nhật thanh toán: ${updatePaymentStatusDto.notes}`;
    }

    return this.bookingRepository.save(booking);
  }

  /**
   * Khởi tạo quy trình thanh toán cho đặt phòng
   */
  async initiatePayment(bookingId: string): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error('Đặt phòng chưa được xác nhận');
    }

    if (booking.paymentStatus !== PaymentStatus.UNPAID && booking.paymentStatus !== PaymentStatus.PENDING_VERIFICATION) {
      throw new Error('Đặt phòng đã được thanh toán hoặc đang trong quá trình thanh toán');
    }

    // Cập nhật trạng thái đặt phòng
    booking.status = BookingStatus.PAYMENT_PENDING;
    await this.bookingRepository.save(booking);

    // Tạo thông tin thanh toán và mã QR cho đặt phòng
    return await paymentService.generatePaymentInfo(bookingId);
  }

  /**
   * Lấy thông tin thanh toán của đặt phòng
   */
  async getPaymentInfo(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      select: [
        'id', 'totalPrice', 'paymentStatus', 'paymentMethod',
        'paymentReference', 'paymentQrCode', 'paymentDate', 'paymentVerifiedAt'
      ]
    });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    return booking;
  }

  /**
   * Lấy tất cả đặt phòng (cho admin)
   */
  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['homestay', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Lấy đặt phòng theo trạng thái
   */
  async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { status },
      relations: ['homestay', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Đếm số đặt phòng theo trạng thái
   */
  async countBookingsByStatus(status: BookingStatus): Promise<number> {
    return this.bookingRepository.count({
      where: { status }
    });
  }

  /**
   * Tính tổng doanh thu từ các đặt phòng đã thanh toán
   */
  async calculateTotalRevenue(): Promise<number> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalPrice)', 'total')
      .where('booking.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    return result?.total || 0;
  }

  /**
   * Lấy các đặt phòng mới nhất đang chờ xác nhận thanh toán
   */
  async getRecentPendingPayments(limit: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { paymentStatus: PaymentStatus.PENDING_VERIFICATION },
      relations: ['homestay', 'user'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  /**
   * Admin cập nhật trạng thái đặt phòng
   */
  async adminUpdateBookingStatus(
    bookingId: string,
    status: string | BookingStatus,
    notes?: string
  ): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);

    // Convert string status to enum if needed
    if (typeof status === 'string') {
      // Check if the string is a valid enum value
      if (Object.values(BookingStatus).includes(status as BookingStatus)) {
        booking.status = status as BookingStatus;
      } else {
        throw new Error(`Trạng thái không hợp lệ: ${status}`);
      }
    } else {
      booking.status = status;
    }

    if (notes) {
      booking.notes = booking.notes
        ? `${booking.notes}\n\nAdmin note: ${notes}`
        : `Admin note: ${notes}`;
    }

    return this.bookingRepository.save(booking);
  }

  /**
   * Xác nhận người dùng đã thanh toán và cập nhật trạng thái thành đang chờ xác minh
   */
  async confirmUserPayment(userId: number, bookingId: string): Promise<Booking> {
    // Kiểm tra booking tồn tại
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'homestay']
    });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    // Kiểm tra booking thuộc về người dùng
    if (booking.userId !== userId) {
      throw new Error('Bạn không có quyền xác nhận thanh toán cho đặt phòng này');
    }

    // Kiểm tra trạng thái booking
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error('Đặt phòng chưa được xác nhận');
    }

    // Kiểm tra trạng thái thanh toán
    if (booking.paymentStatus !== PaymentStatus.PENDING) {
      if (booking.paymentStatus === PaymentStatus.PAID) {
        throw new Error('Đặt phòng đã được thanh toán');
      }

      if (booking.paymentStatus === PaymentStatus.WAITING_APPROVAL) {
        throw new Error('Đặt phòng đang chờ xác nhận thanh toán');
      }

      throw new Error('Trạng thái đặt phòng không hợp lệ để xác nhận thanh toán');
    }

    // Cập nhật trạng thái thanh toán thành đang chờ xác minh
    booking.paymentStatus = PaymentStatus.WAITING_APPROVAL;
    booking.paymentConfirmedAt = new Date();

    // Lưu lại thông tin booking
    await this.bookingRepository.save(booking);

    // Gửi email thông báo cho admin về việc có thanh toán chờ xác nhận
    await this.notifyAdminAboutPaymentConfirmation(booking);

    return booking;
  }

  /**
   * Gửi thông báo cho admin về việc có thanh toán chờ xác nhận
   */
  private async notifyAdminAboutPaymentConfirmation(booking: Booking): Promise<void> {
    try {
      // Lấy thông tin user và homestay
      const user = booking.user;
      const homestay = booking.homestay;

      if (!user || !homestay) {
        console.error('Thiếu thông tin user hoặc homestay khi gửi email thông báo thanh toán');
        return;
      }

      // Chuẩn bị nội dung HTML cho email
      const htmlContent = `
        <h1>Thông báo: Có thanh toán mới đang chờ xác nhận</h1>
        <p>Booking ID: <strong>${booking.id}</strong></p>
        <p>Khách hàng: <strong>${user.fullName}</strong> (${user.email})</p>
        <p>Homestay: <strong>${homestay.name}</strong> (${homestay.address})</p>
        <p>Số tiền: <strong>${booking.totalPrice.toLocaleString('vi-VN')} VND</strong></p>
        <p>Mã tham chiếu: <strong>${booking.paymentReference || 'N/A'}</strong></p>
        <p>Thời gian xác nhận: <strong>${booking.paymentConfirmedAt?.toLocaleString('vi-VN') || 'N/A'}</strong></p>
        <p>Vui lòng truy cập <a href="${process.env.ADMIN_URL || 'http://localhost:5173'}/admin/payments">hệ thống quản trị</a> để xác thực thanh toán này.</p>
      `;

      // Gửi email thông báo cho admin
      await emailService.sendMail({
        to: process.env.ADMIN_EMAIL || 'admin@hdhomestay.com',
        subject: 'Có thanh toán mới chờ xác nhận',
        html: htmlContent
      });
    } catch (error) {
      console.error('Lỗi khi gửi email thông báo cho admin:', error);
      // Không ném lỗi ra ngoài vì không muốn ảnh hưởng đến luồng xử lý chính
    }
  }

  /**
   * Lấy danh sách đặt phòng theo trạng thái thanh toán
   * @param status - Trạng thái thanh toán cần lọc
   * @returns Danh sách đặt phòng
   */
  async getBookingsWithPaymentStatus(paymentStatus: PaymentStatus): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: {
        paymentStatus,
      },
      relations: ['user', 'homestay'],
      order: {
        createdAt: 'DESC', // Sắp xếp theo thời gian tạo mới nhất
      },
    });
  }
}

export default new BookingService();
