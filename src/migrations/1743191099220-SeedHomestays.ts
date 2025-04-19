import { MigrationInterface, QueryRunner } from 'typeorm';
import { HomestayStatus } from '../models/homestay';

export class CreateHomestayAndData1743191099220 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng homestays
    await queryRunner.query(`
      CREATE TABLE homestays (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ownerID INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        location VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        images TEXT,
        amenities TEXT,
        cancellationPolicy TEXT,
        status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerID) REFERENCES users(id)
      )
    `);

    // Get admin user id
    const adminUser = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1`
    );
    const adminId = adminUser[0]?.id;

    if (!adminId) {
      throw new Error('Admin user not found. Please run the previous migration first.');
    }

    // Sample homestay data
    const homestays = [
      {
        name: 'Villa Đà Lạt Garden',
        address: '42 Đường Trần Hưng Đạo, Phường 3, Đà Lạt, Lâm Đồng',
        location: 'Đà Lạt',
        price: 1200000,
        description: 'Villa sang trọng với view đẹp nhìn ra thành phố Đà Lạt.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Bãi đỗ xe', 'Hồ bơi', 'Điều hòa', 'Nhà bếp']),
        cancellationPolicy: 'Miễn phí hủy phòng trước 7 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Sapa Mountain View',
        address: '15 Đường Fansipan, Thị trấn Sapa, Lào Cai',
        location: 'Sapa',
        price: 800000,
        description: 'Homestay mang đậm bản sắc dân tộc, view núi Fansipan.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Bếp chung', 'Sưởi', 'Lò sưởi']),
        cancellationPolicy: 'Miễn phí hủy phòng trước 3 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Phú Quốc Beach House',
        address: '78 Trần Hưng Đạo, Dương Đông, Phú Quốc',
        location: 'Phú Quốc',
        price: 1500000,
        description: 'Beach house sang trọng ngay bãi biển.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Hồ bơi', 'BBQ', 'Điều hòa', 'Nhà bếp']),
        cancellationPolicy: 'Hoàn tiền 100% nếu hủy trước 14 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Hội An Ancient House',
        address: '25 Nguyễn Thái Học, Minh An, Hội An',
        location: 'Hội An',
        price: 900000,
        description: 'Nhà cổ truyền thống trong lòng phố cổ Hội An.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Điều hòa', 'TV', 'Tủ lạnh']),
        cancellationPolicy: 'Hoàn tiền 50% nếu hủy trước 7 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Mộc Châu Highland',
        address: '156 Tiểu Khu 14, Mộc Châu, Sơn La',
        location: 'Mộc Châu',
        price: 1100000,
        description: 'Resort nhỏ giữa cao nguyên Mộc Châu.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60',
        ]),
        amenities: JSON.stringify(['Wifi', 'Bãi đỗ xe', 'Nhà hàng', 'Điều hòa']),
        cancellationPolicy: 'Không hoàn tiền khi hủy phòng.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Hạ Long Bay View',
        address: '68 Hùng Thắng, Bãi Cháy, Hạ Long',
        location: 'Hạ Long',
        price: 1300000,
        description: 'Căn hộ cao cấp view vịnh Hạ Long.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Bãi đỗ xe', 'Hồ bơi', 'Gym']),
        cancellationPolicy: 'Hoàn tiền 70% nếu hủy trước 10 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Mũi Né Bungalow',
        address: '222 Nguyễn Đình Chiểu, Hàm Tiến, Phan Thiết',
        location: 'Mũi Né',
        price: 950000,
        description: 'Bungalow ven biển với không gian riêng tư.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Điều hòa', 'TV', 'BBQ']),
        cancellationPolicy: 'Hoàn tiền 100% nếu hủy trước 5 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Tam Đảo Lodge',
        address: '45 Thị trấn, Tam Đảo, Vĩnh Phúc',
        location: 'Tam Đảo',
        price: 850000,
        description: 'Lodge ấm cúng trên đỉnh Tam Đảo.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Sưởi', 'TV', 'Nhà bếp']),
        cancellationPolicy: 'Hoàn tiền 50% nếu hủy trước 3 ngày.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Cần Thơ Riverside',
        address: '89 Hai Bà Trưng, Ninh Kiều, Cần Thơ',
        location: 'Cần Thơ',
        price: 750000,
        description: 'Nhà nghỉ ven sông với không gian thoáng đãng.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Điều hòa', 'TV', 'Bếp']),
        cancellationPolicy: 'Không hoàn tiền khi hủy phòng.',
        status: HomestayStatus.ACTIVE,
      },
      {
        name: 'Ninh Bình Eco Valley',
        address: '156 Tràng An, Hoa Lư, Ninh Bình',
        location: 'Ninh Bình',
        price: 1000000,
        description: 'Khu nghỉ dưỡng sinh thái giữa thung lũng.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60'
        ]),
        amenities: JSON.stringify(['Wifi', 'Điều hòa', 'Nhà hàng', 'Xe đạp']),
        cancellationPolicy: 'Hoàn tiền 80% nếu hủy trước 7 ngày.',
        status: HomestayStatus.ACTIVE,
      },
    ];

    // Insert homestays
    for (const homestay of homestays) {
      await queryRunner.query(`
        INSERT INTO homestays (
          ownerID,
          name,
          address,
          location,
          price,
          description,
          images,
          amenities,
          cancellationPolicy,
          status
        ) VALUES (
          ${adminId},
          '${homestay.name}',
          '${homestay.address}',
          '${homestay.location}',
          ${homestay.price},
          '${homestay.description}',
          '${homestay.images}',
          '${homestay.amenities}',
          '${homestay.cancellationPolicy}',
          '${homestay.status}'
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop homestays table
    await queryRunner.query('DROP TABLE IF EXISTS homestays');
  }
}
