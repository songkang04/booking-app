db = db.getSiblingDB('booking_app');

// Kiểm tra xem đã có admin chưa
const adminExists = db.users.findOne({ email: 'admin@example.com' });

if (!adminExists) {
  // Tạo admin user (mật khẩu là 'admin@123')
  // Mật khẩu phải được hash bằng bcrypt trước khi lưu vào database
  // Bạn nên thay đổi mật khẩu này sau khi deploy
  db.users.insertOne({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: '$2b$10$VfBOnl9.DP1t58zlg1EXDOOzWym9qE0TUEzRUJGkyvOA/YE2FBy4e', // bcrypt hash for 'admin@123'
    role: 'admin',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  print('Admin user created successfully!');
} else {
  print('Admin user already exists!');
}

// Tạo indexes for schemas
db.users.createIndex({ email: 1 }, { unique: true });
db.homestays.createIndex({ name: 'text', description: 'text', city: 'text', province: 'text' });
db.homestays.createIndex({ hostId: 1 });
db.homestays.createIndex({ city: 1 });
db.homestays.createIndex({ province: 1 });
db.homestays.createIndex({ price: 1 });
db.bookings.createIndex({ userId: 1, status: 1 });
db.bookings.createIndex({ homestayId: 1, status: 1 });
db.bookings.createIndex({ checkInDate: 1, checkOutDate: 1 });
db.bookings.createIndex({ paymentStatus: 1 });
db.bookings.createIndex({ createdAt: -1 });
db.reviews.createIndex({ homestayId: 1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ rating: -1 });

print('MongoDB initialization completed successfully!');
