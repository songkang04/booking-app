import mongoose from 'mongoose';

/**
 * Kết nối đến MongoDB
 */
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUser = process.env.MONGO_USER || 'admin';
    const mongoPassword = process.env.MONGO_PASSWORD || 'password';
    const mongoHost = process.env.MONGO_HOST || 'localhost';
    const mongoPort = process.env.MONGO_PORT || '27017';
    const mongoDb = process.env.MONGO_DB || 'booking_app';

    const mongoURI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDb}?authSource=admin`;

    console.log('Đang kết nối đến MongoDB...');

    await mongoose.connect(mongoURI);

    console.log('✅ Kết nối MongoDB thành công');

    // Xử lý sự kiện kết nối
    mongoose.connection.on('error', (err) => {
      console.error('❌ Lỗi kết nối MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB bị ngắt kết nối');
    });

    // Xử lý tắt ứng dụng
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Lỗi kết nối đến MongoDB:', error);
    process.exit(1);
  }
};

export default mongoose;
