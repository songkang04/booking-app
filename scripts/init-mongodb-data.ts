import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectMongoDB } from '../src/config/mongodb';
import { User, UserRole } from '../src/schemas/user.schema';
import { Homestay } from '../src/schemas/homestay.schema';

dotenv.config();

/**
 * Script để khởi tạo dữ liệu cơ bản cho MongoDB
 */
async function initializeMongoDBData() {
    try {
        console.log('🚀 Bắt đầu khởi tạo dữ liệu cơ bản cho MongoDB...');
        
        // Kết nối đến MongoDB
        console.log('🔌 Đang kết nối đến MongoDB...');
        await connectMongoDB();
        console.log('✅ Kết nối MongoDB thành công!');

        // Tạo tài khoản admin
        console.log('👤 Đang tạo tài khoản admin...');
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (!existingAdmin) {
            // Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin@123', salt);
            
            const admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: UserRole.ADMIN,
                isEmailVerified: true,
            });
            
            await admin.save();
            console.log('✅ Đã tạo tài khoản admin thành công.');
        } else {
            console.log('ℹ️ Tài khoản admin đã tồn tại.');
        }

        // Tạo tài khoản demo cho người dùng
        console.log('👤 Đang tạo tài khoản demo...');
        const existingDemoUser = await User.findOne({ email: 'user@example.com' });
        
        if (!existingDemoUser) {
            // Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('User@123', salt);
            
            const demoUser = new User({
                firstName: 'Demo',
                lastName: 'User',
                email: 'user@example.com',
                password: hashedPassword,
                role: UserRole.USER,
                isEmailVerified: true,
            });
            
            await demoUser.save();
            console.log('✅ Đã tạo tài khoản demo thành công.');
        } else {
            console.log('ℹ️ Tài khoản demo đã tồn tại.');
        }

        // Lấy id của admin để tạo homestay
        const admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            throw new Error('Không tìm thấy tài khoản admin');
        }

        // Tạo dữ liệu mẫu homestay
        console.log('🏠 Đang tạo dữ liệu mẫu homestay...');
        
        const homestays = [
            {
                name: 'Villa Đà Lạt Garden',
                description: 'Villa sang trọng với view đẹp nhìn ra thành phố Đà Lạt.',
                address: '42 Đường Trần Hưng Đạo, Phường 3, Đà Lạt',
                city: 'Đà Lạt',
                province: 'Lâm Đồng',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
                ],
                price: 1200000,
                capacity: 8,
                bedroomCount: 4,
                bathroomCount: 3,
                amenities: ['Wifi', 'Bãi đỗ xe', 'Hồ bơi', 'Điều hòa', 'Nhà bếp'],
                hostId: admin._id,
                isActive: true
            },
            {
                name: 'Sapa Mountain View',
                description: 'Homestay mang đậm bản sắc dân tộc, view núi Fansipan.',
                address: '15 Đường Fansipan, Thị trấn Sapa',
                city: 'Sapa',
                province: 'Lào Cai',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
                ],
                price: 800000,
                capacity: 6,
                bedroomCount: 3,
                bathroomCount: 2,
                amenities: ['Wifi', 'Bếp chung', 'Sưởi', 'Lò sưởi'],
                hostId: admin._id,
                isActive: true
            },
            {
                name: 'Hội An Ancient House',
                description: 'Nhà cổ truyền thống trong lòng phố cổ Hội An.',
                address: '25 Nguyễn Thái Học, Minh An, Hội An',
                city: 'Hội An',
                province: 'Quảng Nam',
                country: 'Việt Nam',
                images: [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
                ],
                price: 900000,
                capacity: 4,
                bedroomCount: 2,
                bathroomCount: 1,
                amenities: ['Wifi', 'Điều hòa', 'TV', 'Tủ lạnh'],
                hostId: admin._id,
                isActive: true
            }
        ];

        // Kiểm tra xem có homestay nào chưa
        const existingHomestays = await Homestay.countDocuments();
        
        if (existingHomestays === 0) {
            // Thêm dữ liệu mẫu nếu chưa có homestay nào
            for (const homestayData of homestays) {
                const homestay = new Homestay(homestayData);
                await homestay.save();
            }
            console.log(`✅ Đã tạo ${homestays.length} homestay mẫu thành công.`);
        } else {
            console.log(`ℹ️ Đã có ${existingHomestays} homestay trong cơ sở dữ liệu.`);
        }

        console.log('🎉 Khởi tạo dữ liệu thành công!');
        
        // Đóng kết nối MongoDB
        await mongoose.connection.close();
        console.log('👋 Đã đóng kết nối MongoDB.');
        
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo dữ liệu:', error);
    } finally {
        process.exit(0);
    }
}

// Chạy hàm khởi tạo
initializeMongoDBData();
