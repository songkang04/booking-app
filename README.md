# Booking App - Backend

Một ứng dụng quản lý và đặt phòng homestay được xây dựng với Node.js, Express, và MongoDB.

## Tính năng

- Đăng ký, đăng nhập và quản lý tài khoản người dùng
- Xem danh sách và chi tiết homestay
- Đặt phòng và quản lý đặt phòng
- Thanh toán và quản lý thanh toán
- Đánh giá và phản hồi
- Quản lý homestay dành cho chủ nhà
- Quản trị hệ thống

## Yêu cầu hệ thống

- Node.js v18+
- npm v9+
- MongoDB v6+
- Docker và Docker Compose (tùy chọn)

## Cài đặt

### Sử dụng Docker

1. Sao chép file `example.env` thành `.env` và điều chỉnh các thông số nếu cần:

```bash
cp example.env .env
```

2. Khởi động các container với Docker Compose:

```bash
docker-compose up -d
```

3. Cài đặt các phụ thuộc và khởi động ứng dụng:

```bash
npm install
npm run dev
```

4. Tạo dữ liệu ban đầu (tùy chọn):

```bash
npm run init:mongodb
```

### Cài đặt thủ công

1. Cài đặt MongoDB và đảm bảo nó đang chạy

2. Sao chép file `example.env` thành `.env` và điều chỉnh các thông số:

```bash
cp example.env .env
```

3. Cài đặt các phụ thuộc:

```bash
npm install
```

4. Khởi động ứng dụng:

```bash
npm run dev
```

5. Tạo dữ liệu ban đầu (tùy chọn):

```bash
npm run init:mongodb
```

## Cấu trúc dự án

```
booking-app/
├── docker-compose.yml    # Cấu hình Docker
├── package.json          # Quản lý phụ thuộc và lệnh
├── tsconfig.json         # Cấu hình TypeScript
├── docs/                 # Tài liệu
├── mongo-init/           # Script khởi tạo MongoDB
├── src/
│   ├── app.ts            # Điểm vào ứng dụng
│   ├── config/           # Cấu hình (MongoDB, email, ...)
│   ├── constants/        # Hằng số và enum
│   ├── controllers/      # Xử lý request và response
│   ├── dtos/             # Đối tượng truyền dữ liệu
│   ├── middlewares/      # Middleware Express
│   ├── migrations/       # Script khởi tạo dữ liệu
│   ├── schemas/          # Mongoose schema
│   ├── routes/           # Định nghĩa route
│   ├── services/         # Logic nghiệp vụ
│   ├── templates/        # Template email
│   ├── tests/            # Unit và integration tests
│   ├── types/            # Định nghĩa type
│   ├── utils/            # Tiện ích
│   └── validations/      # Xác thực dữ liệu
└── uploads/              # Thư mục lưu file upload
```

## API Documentation

API documentation có sẵn tại endpoint `/api/docs` sau khi khởi động ứng dụng.

## Tài khoản mặc định

- Admin: admin@example.com / Admin@123
- User: user@example.com / User@123

## Môi trường phát triển

- URL: http://localhost:3000
- MongoDB Express: http://localhost:8081

## Thông tin liên hệ

- Email: example@example.com
