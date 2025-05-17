import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Booking, BookingStatus, PaymentStatus } from '../models/booking';
import { User } from '../models/user';
import { generatePaymentQRCode } from '../utils/qrcode';
import emailService from '../config/mail';

interface PaymentConfig {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export class PaymentService {
  private bookingRepository: Repository<Booking>;
  private userRepository: Repository<User>;
  private paymentConfig: PaymentConfig;

  constructor() {
    this.bookingRepository = AppDataSource.getRepository(Booking);
    this.userRepository = AppDataSource.getRepository(User);

    // Thông tin tài khoản ngân hàng để tạo mã QR
    this.paymentConfig = {
      accountName: process.env.PAYMENT_ACCOUNT_NAME || 'Công ty TNHH HD Homestay',
      accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || '1234567890',
      bankName: process.env.PAYMENT_BANK_NAME || 'VietcomBank'
    };
  }

  /**
   * Tạo thông tin thanh toán cho đặt phòng
   */
  async generatePaymentInfo(bookingId: string): Promise<Booking> {
    // Tìm thông tin đặt phòng
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'homestay']
    });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    // Tạo mã tham chiếu thanh toán (kết hợp mã đặt phòng + người dùng)
    const paymentReference = `HDBK${bookingId.substring(0, 8)}${booking.userId}`;

    // Tạo mã QR cho thanh toán
    const qrCodeUrl = await generatePaymentQRCode({
      accountNumber: this.paymentConfig.accountNumber,
      accountName: this.paymentConfig.accountName,
      bankName: this.paymentConfig.bankName,
      amount: Number(booking.totalPrice),
      reference: paymentReference
    });

    // Cập nhật thông tin thanh toán vào đặt phòng
    booking.paymentStatus = PaymentStatus.PENDING_VERIFICATION;
    booking.paymentMethod = 'bank_transfer';
    booking.paymentReference = paymentReference;
    booking.paymentQrCode = qrCodeUrl;

    // Lưu thông tin đặt phòng
    const updatedBooking = await this.bookingRepository.save(booking);

    // Gửi email thông tin thanh toán cho khách hàng
    await this.sendPaymentInstructions(updatedBooking);

    return updatedBooking;
  }

  /**
   * Xác nhận thanh toán của khách hàng (thực hiện bởi quản trị viên)
   */
  async verifyPayment(bookingId: string, adminId: number, notes?: string, approved: boolean = true): Promise<Booking> {
    // Tìm thông tin đặt phòng
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'homestay']
    });

    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    // Kiểm tra trạng thái thanh toán hiện tại
    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Đặt phòng này đã được thanh toán');
    }

    // Nếu phê duyệt thanh toán
    if (approved) {
      // Cập nhật thông tin thanh toán
      booking.paymentStatus = PaymentStatus.PAID;
      booking.paymentVerifiedBy = adminId;
      booking.paymentVerifiedAt = new Date();
      booking.status = BookingStatus.RENTED; // Cập nhật trạng thái đặt phòng thành "Đã cho thuê"

      if (notes) {
        booking.notes = booking.notes ? `${booking.notes}\n\nXác nhận thanh toán: ${notes}` : `Xác nhận thanh toán: ${notes}`;
      }
    } else {
      // Từ chối thanh toán - quay lại trạng thái PENDING để yêu cầu thanh toán lại
      booking.paymentStatus = PaymentStatus.PENDING;

      const rejectNote = notes ? `Từ chối thanh toán: ${notes}` : 'Từ chối thanh toán';
      booking.notes = booking.notes ? `${booking.notes}\n\n${rejectNote}` : rejectNote;

      // Xóa thông tin xác nhận thanh toán từ người dùng (paymentConfirmedAt có thể là null)
    }

    // Lưu thông tin đặt phòng
    const updatedBooking = await this.bookingRepository.save(booking);

    // Gửi email xác nhận thanh toán cho khách hàng
    await this.sendPaymentConfirmation(updatedBooking);

    return updatedBooking;
  }

  /**
   * Gửi hướng dẫn thanh toán qua email
   */
  private async sendPaymentInstructions(booking: Booking): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: booking.userId });

    if (!user || !user.email) {
      console.error('Không thể gửi email hướng dẫn thanh toán: Không tìm thấy thông tin người dùng');
      return;
    }

    // Sử dụng phương thức sendMail đã thêm vào EmailService
    await emailService.sendMail({
      to: user.email,
      subject: `[HD Homestay] Hướng dẫn thanh toán cho đặt phòng #${booking.id.substring(0, 8)}`,
      html: `
        <h2>Xin chào ${user.firstName} ${user.lastName},</h2>
        <p>Cảm ơn bạn đã đặt phòng tại HD Homestay. Dưới đây là thông tin thanh toán:</p>

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Thông tin thanh toán</h3>
          <p><strong>Số tiền:</strong> ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
          <p><strong>Tài khoản:</strong> ${this.paymentConfig.accountNumber}</p>
          <p><strong>Tên chủ tài khoản:</strong> ${this.paymentConfig.accountName}</p>
          <p><strong>Ngân hàng:</strong> ${this.paymentConfig.bankName}</p>
          <p><strong>Nội dung chuyển khoản:</strong> ${booking.paymentReference}</p>
        </div>

        <p>Vui lòng quét mã QR dưới đây để thanh toán hoặc sử dụng thông tin chuyển khoản trên:</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="cid:payment-qrcode" alt="Mã QR thanh toán" style="max-width: 250px;" />
        </div>

        <p><strong>Lưu ý:</strong></p>
        <ul>
          <li>Sau khi thanh toán, vui lòng đợi xác nhận từ chúng tôi.</li>
          <li>Trạng thái đặt phòng của bạn sẽ được cập nhật thành "Đã cho thuê" sau khi thanh toán được xác nhận.</li>
          <li>Thời gian xác nhận thanh toán thường mất từ 1-2 giờ trong giờ hành chính.</li>
        </ul>

        <p>Mọi thắc mắc, vui lòng liên hệ với chúng tôi qua email hoặc hotline trên website.</p>

        <p>Trân trọng,<br />Đội ngũ HD Homestay</p>
      `,
      attachments: [
        {
          filename: 'payment-qrcode.png',
          path: `.${booking.paymentQrCode}`, // Đường dẫn đến file QR code
          cid: 'payment-qrcode' // Same cid value as in the html
        }
      ]
    });
  }

  /**
   * Gửi xác nhận thanh toán thành công qua email
   */
  private async sendPaymentConfirmation(booking: Booking): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: booking.userId });

    if (!user || !user.email) {
      console.error('Không thể gửi email xác nhận thanh toán: Không tìm thấy thông tin người dùng');
      return;
    }

    await emailService.sendMail({
      to: user.email,
      subject: `[HD Homestay] Xác nhận thanh toán thành công cho đặt phòng #${booking.id.substring(0, 8)}`,
      html: `
        <h2>Xin chào ${user.firstName} ${user.lastName},</h2>
        <p>Chúng tôi xác nhận đã nhận được thanh toán của bạn cho đặt phòng tại HD Homestay.</p>

        <div style="background-color: #f0fff0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Thông tin đặt phòng</h3>
          <p><strong>Mã đặt phòng:</strong> ${booking.id}</p>
          <p><strong>Homestay:</strong> ${booking.homestay.name}</p>
          <p><strong>Ngày nhận phòng:</strong> ${new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</p>
          <p><strong>Ngày trả phòng:</strong> ${new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}</p>
          <p><strong>Số tiền đã thanh toán:</strong> ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
          <p><strong>Trạng thái:</strong> <span style="color: #28a745; font-weight: bold;">Đã thanh toán</span></p>
        </div>

        <p>Chúc bạn có kỳ nghỉ tuyệt vời tại HD Homestay!</p>

        <p><strong>Thông tin quan trọng:</strong></p>
        <ul>
          <li>Vui lòng mang theo CMND/CCCD khi nhận phòng.</li>
          <li>Giờ nhận phòng: sau 14:00.</li>
          <li>Giờ trả phòng: trước 12:00.</li>
        </ul>

        <p>Nếu có bất kỳ thay đổi nào về lịch trình, vui lòng thông báo cho chúng tôi trước ít nhất 24 giờ.</p>

        <p>Trân trọng,<br />Đội ngũ HD Homestay</p>
      `
    });
  }
}

const paymentService = new PaymentService();
export default paymentService;
