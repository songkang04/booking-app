const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
  try {
    console.log('Environment variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- MONGO_USER:', process.env.MONGO_USER);
    console.log('- MONGO_HOST:', process.env.MONGO_HOST);
    console.log('- MONGO_PORT:', process.env.MONGO_PORT);
    console.log('- MONGO_DB:', process.env.MONGO_DB);
    
    const mongoUser = process.env.MONGO_USER || 'admin';
    const mongoPassword = process.env.MONGO_PASSWORD || 'password';
    const mongoHost = process.env.MONGO_HOST || 'localhost';
    const mongoPort = process.env.MONGO_PORT || '27017';
    const mongoDb = process.env.MONGO_DB || 'booking_app';

    const mongoURI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDb}?authSource=admin`;

    console.log('\nĐang thử kết nối đến MongoDB...');
    console.log(`URI: mongodb://${mongoUser}:***@${mongoHost}:${mongoPort}/${mongoDb}?authSource=admin`);

    await mongoose.connect(mongoURI);
    console.log('✅ Kết nối MongoDB thành công!');

    // Check if collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nDanh sách collections:');
    if (collections.length === 0) {
      console.log('- Không có collections nào.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }

    // Get stats
    const stats = await mongoose.connection.db.stats();
    console.log('\nThông số cơ sở dữ liệu:');
    console.log(`- Số lượng collections: ${stats.collections}`);
    console.log(`- Số lượng đối tượng: ${stats.objects}`);
    console.log(`- Kích thước dữ liệu: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    console.error('Chi tiết lỗi:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Không thể kết nối đến MongoDB server. Hãy kiểm tra:');
      console.error('1. MongoDB container đang chạy');
      console.error('2. MongoDB host và port đúng');
      console.error('3. Tên người dùng và mật khẩu đúng');
    }
  } finally {
    process.exit(0);
  }
}

testMongoDBConnection();
