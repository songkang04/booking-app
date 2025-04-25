import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Booking, BookingStatus } from '../models/booking';
import { User } from '../models/user';
import { Homestay } from '../models/homestay';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dtos/booking.dto';
import crypto from 'crypto';
import emailService from '../config/mail';

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

    // Tính số ngày đặt phòng
    const checkInDate = new Date(createBookingDto.checkInDate);
    const checkOutDate = new Date(createBookingDto.checkOutDate);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Tính tổng giá tiền
    const totalPrice = homestay.price * diffDays;

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

    return updatedBooking;
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
}

export default new BookingService();
