import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Review } from '../models/review';
import { User } from '../models/user';
import { Homestay, HomestayStatus } from '../models/homestay';
import type { CreateReviewDto, UpdateReviewDto, ReviewSearchParams } from '../dtos/review';

class ReviewService {
  private reviewRepository: Repository<Review>;
  private userRepository: Repository<User>;
  private homestayRepository: Repository<Homestay>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.userRepository = AppDataSource.getRepository(User);
    this.homestayRepository = AppDataSource.getRepository(Homestay);
  }

  async createReview(userId: number, createData: CreateReviewDto): Promise<Review> {
    try {
      // Kiểm tra homestay có tồn tại không
      const homestay = await this.homestayRepository.findOne({
        where: { 
          id: createData.homestayId,
          status: HomestayStatus.ACTIVE
        }
      });
      
      if (!homestay) {
        throw new Error('Homestay không tồn tại');
      }
      
      // Kiểm tra người dùng đã đánh giá homestay này chưa
      const existingReview = await this.reviewRepository.findOne({
        where: {
          userId,
          homestayId: createData.homestayId
        }
      });
      
      if (existingReview) {
        throw new Error('Bạn đã đánh giá homestay này rồi');
      }
      
      // Tạo đánh giá mới
      const review = this.reviewRepository.create({
        userId,
        homestayId: createData.homestayId,
        rating: createData.rating,
        comment: createData.comment
      });
      
      return await this.reviewRepository.save(review);
    } catch (error) {
      console.error('Lỗi khi tạo đánh giá:', error);
      throw error;
    }
  }

  async updateReview(reviewId: number, userId: number, updateData: UpdateReviewDto): Promise<Review> {
    try {
      // Tìm đánh giá
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId }
      });
      
      if (!review) {
        throw new Error('Không tìm thấy đánh giá');
      }
      
      // Kiểm tra người dùng có quyền cập nhật đánh giá không
      if (review.userId !== userId) {
        throw new Error('Bạn không có quyền cập nhật đánh giá này');
      }
      
      // Cập nhật đánh giá
      Object.assign(review, updateData);
      
      return await this.reviewRepository.save(review);
    } catch (error) {
      console.error('Lỗi khi cập nhật đánh giá:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: number, userId: number): Promise<void> {
    try {
      // Tìm đánh giá
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId }
      });
      
      if (!review) {
        throw new Error('Không tìm thấy đánh giá');
      }
      
      // Kiểm tra người dùng có quyền xóa đánh giá không
      if (review.userId !== userId) {
        throw new Error('Bạn không có quyền xóa đánh giá này');
      }
      
      // Xóa đánh giá
      await this.reviewRepository.remove(review);
    } catch (error) {
      console.error('Lỗi khi xóa đánh giá:', error);
      throw error;
    }
  }

  async getHomestayReviews(homestayId: number, params: ReviewSearchParams = {}): Promise<[Review[], number]> {
    try {
      const {
        userId,
        minRating,
        maxRating,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = params;
      
      // Tạo query builder để lấy đánh giá
      const queryBuilder = this.reviewRepository.createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .where('review.homestayId = :homestayId', { homestayId });
      
      // Thêm các điều kiện tìm kiếm
      if (userId) {
        queryBuilder.andWhere('review.userId = :userId', { userId });
      }
      
      if (minRating && maxRating) {
        queryBuilder.andWhere('review.rating BETWEEN :minRating AND :maxRating', { minRating, maxRating });
      } else if (minRating) {
        queryBuilder.andWhere('review.rating >= :minRating', { minRating });
      } else if (maxRating) {
        queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
      }
      
      // Sắp xếp và phân trang
      queryBuilder
        .orderBy(`review.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit);
      
      // Thực hiện truy vấn
      const [reviews, total] = await queryBuilder.getManyAndCount();
      
      return [reviews, total];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
      throw error;
    }
  }

  async responseToReview(reviewId: number, ownerId: number, response: string): Promise<Review> {
    try {
      // Tìm đánh giá
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['homestay']
      });
      
      if (!review) {
        throw new Error('Không tìm thấy đánh giá');
      }
      
      // Kiểm tra người dùng có quyền phản hồi đánh giá không
      const homestay = await this.homestayRepository.findOne({
        where: { id: review.homestayId }
      });
      
      if (!homestay || homestay.ownerID !== ownerId) {
        throw new Error('Bạn không có quyền phản hồi đánh giá này');
      }
      
      // Cập nhật phản hồi
      review.response = response;
      
      return await this.reviewRepository.save(review);
    } catch (error) {
      console.error('Lỗi khi phản hồi đánh giá:', error);
      throw error;
    }
  }

  async getAverageRating(homestayId: number): Promise<number> {
    try {
      const result = await this.reviewRepository
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'avgRating')
        .where('review.homestayId = :homestayId', { homestayId })
        .getRawOne();
      
      return result.avgRating || 0;
    } catch (error) {
      console.error('Lỗi khi lấy đánh giá trung bình:', error);
      return 0;
    }
  }
}

export default new ReviewService();
