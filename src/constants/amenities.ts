// Danh sách tiện nghi chuẩn
export const AmenitiesCategories = [
  {
    category: 'Cơ bản',
    items: [
      'Wifi',
      'TV',
      'Điều hòa',
      'Máy giặt',
      'Nóng lạnh',
      'Bàn làm việc'
    ]
  },
  {
    category: 'Không gian',
    items: [
      'Ban công',
      'Vườn',
      'Sân thượng',
      'Bếp riêng',
      'Phòng khách riêng',
      'Lối vào riêng'
    ]
  },
  {
    category: 'Tiện ích',
    items: [
      'Bãi đỗ xe',
      'Hồ bơi',
      'Phòng gym',
      'Nhà bếp',
      'Lò vi sóng',
      'Tủ lạnh'
    ]
  },
  {
    category: 'An toàn',
    items: [
      'Báo cháy',
      'Bình cứu hỏa',
      'Khóa cửa an toàn',
      'Bộ sơ cứu',
      'Camera an ninh'
    ]
  }
];

// Tất cả tiện nghi dưới dạng mảng phẳng
export const AllAmenities = AmenitiesCategories.reduce((acc, category) => {
  return [...acc, ...category.items];
}, [] as string[]);

// Kiểm tra xem một tiện nghi có hợp lệ không
export const isValidAmenity = (amenity: string): boolean => {
  return AllAmenities.includes(amenity);
};
