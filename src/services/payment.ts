import { Booking, PaymentStatus } from '../schemas/booking.schema';
import { User } from '../schemas/user.schema';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

class PaymentService {
  async initiatePayment(bookingId: string): Promise<any> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Đặt phòng chưa được xác nhận');
    }

    if (booking.paymentStatus === 'paid') {
      throw new Error('Đặt phòng đã được thanh toán');
    }

    // Tạo QR code nếu chưa có
    if (!booking.paymentQrCode) {
      const qrCode = await this.generatePaymentQRCode(bookingId);
      booking.paymentQrCode = qrCode;
      await booking.save();
    }

    return booking;
  }

  async generatePaymentQRCode(bookingId: string): Promise<string | undefined> {
    try {
      // Tìm thông tin đặt phòng
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Không tìm thấy thông tin đặt phòng');
      }

      // Tạo dữ liệu thanh toán
      const paymentData = {
        bookingId: booking._id,
        amount: booking.totalPrice,
        reference: `payment-${booking.verificationToken || booking._id}`,
      };

      // Tạo thư mục cho QR code nếu chưa tồn tại
      const qrCodeDir = path.join(__dirname, '../../uploads/qrcodes');
      try {
        await mkdirAsync(qrCodeDir, { recursive: true });
      } catch (err) {
        // Thư mục đã tồn tại, bỏ qua lỗi
      }

      // Tạo tên file QR code
      const qrFileName = `payment-${booking.verificationToken || booking._id}-${Date.now()}.png`;
      const qrFilePath = path.join(qrCodeDir, qrFileName);
      const relativePath = `/uploads/qrcodes/${qrFileName}`;

      // Tạo QR code
      await QRCode.toFile(qrFilePath, JSON.stringify(paymentData), {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 1,
        width: 300,
      });

      // Cập nhật thông tin QR code và trạng thái thanh toán
      booking.paymentQrCode = relativePath;
      booking.paymentStatus = PaymentStatus.PENDING;
      await booking.save();

      return relativePath;
    } catch (error) {
      console.error('Lỗi khi tạo QR code thanh toán:', error);
      return undefined;
    }
  }

  async verifyPayment(
    bookingId: string,
    adminId: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<boolean> {
    try {
      // Tìm thông tin đặt phòng
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Không tìm thấy thông tin đặt phòng');
      }

      // Kiểm tra admin tồn tại
      const admin = await User.findById(adminId);
      if (!admin) {
        throw new Error('Không tìm thấy thông tin admin');
      }

      // Cập nhật thông tin thanh toán
      booking.paymentStatus = PaymentStatus.PAID;
      booking.paymentMethod = paymentMethod;
      booking.paymentReference = paymentReference;
      booking.paymentVerifiedBy = adminId as any;
      booking.paymentVerifiedAt = new Date();
      booking.paymentDate = new Date();

      await booking.save();

      return true;
    } catch (error) {
      console.error('Lỗi khi xác nhận thanh toán:', error);
      return false;
    }
  }

  async updatePaymentStatus(
    bookingId: string,
    status: PaymentStatus,
    paymentReference?: string
  ): Promise<boolean> {
    try {
      // Tìm thông tin đặt phòng
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Không tìm thấy thông tin đặt phòng');
      }

      // Cập nhật trạng thái thanh toán
      booking.paymentStatus = status;

      if (paymentReference) {
        booking.paymentReference = paymentReference;
      }

      if (status === PaymentStatus.PAID) {
        booking.paymentDate = new Date();
      }

      await booking.save();

      return true;
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
      return false;
    }
  }

  async getPendingPayments(page: number = 1, limit: number = 10): Promise<{
    payments: any[];
    total: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        Booking.find({
          paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.WAITING_APPROVAL] }
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName email')
          .populate('homestayId', 'name address'),
        Booking.countDocuments({
          paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.WAITING_APPROVAL] }
        })
      ]);

      const payments = bookings.map(booking => ({
        bookingId: booking._id,
        user: booking.userId,
        homestay: booking.homestayId,
        amount: booking.totalPrice,
        status: booking.paymentStatus,
        createdAt: booking.createdAt,
        paymentMethod: booking.paymentMethod,
        paymentReference: booking.paymentReference,
        paymentQrCode: booking.paymentQrCode,
      }));

      return {
        payments,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thanh toán đang chờ:', error);
      return {
        payments: [],
        total: 0,
        pages: 0
      };
    }
  }

  async getPaymentInfo(bookingId: string): Promise<any> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Đặt phòng không tồn tại');
    }

    return {
      id: booking.id,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      paymentQrCode: booking.paymentQrCode,
      paymentReference: booking.paymentReference,
      paymentMethod: booking.paymentMethod,
      paymentDate: booking.paymentDate
    };
  }
}

export default new PaymentService();
