import { Types, SortOrder } from 'mongoose';
import { Booking, BookingStatus } from '../schemas/booking.schema';
import { Homestay } from '../schemas/homestay.schema';
import { Review, IReview } from '../schemas/review.schema';
import { ReviewSearchParams } from '../dtos/review';

class ReviewService {
  // Create a new review
  async createReview(
    userId: string,
    homestayId: string,
    rating: number,
    comment: string
  ): Promise<IReview> {
    // Kiểm tra xem người dùng đã từng đặt và ở homestay này chưa
    const booking = await Booking.findOne({
      userId: new Types.ObjectId(userId),
      homestayId: new Types.ObjectId(homestayId),
      status: BookingStatus.CONFIRMED,
    });

    if (!booking) {
      throw new Error('Bạn cần đặt và ở tại homestay này trước khi đánh giá');
    }

    // Kiểm tra xem người dùng đã đánh giá homestay này chưa
    const existingReview = await Review.findOne({
      userId: new Types.ObjectId(userId),
      homestayId: new Types.ObjectId(homestayId),
    });

    if (existingReview) {
      throw new Error('Bạn đã đánh giá homestay này rồi');
    }

    // Kiểm tra xem homestay có tồn tại không
    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      throw new Error('Homestay không tồn tại');
    }

    // Tạo đánh giá mới
    const review = new Review({
      userId: new Types.ObjectId(userId),
      homestayId: new Types.ObjectId(homestayId),
      rating,
      comment,
    });

    await review.save();

    // Cập nhật rating trung bình của homestay
    await this.updateHomestayRating(homestayId);

    return review.populate('userId', 'firstName lastName profilePicture');
  }

  // Get reviews for a homestay
  async getHomestayReviews(
    homestayId: string,
    params: ReviewSearchParams
  ): Promise<{
    reviews: IReview[];
    total: number;
    averageRating: number;
  }> {
    const query: any = { homestayId: new Types.ObjectId(homestayId) };

    if (params.userId) {
      query.userId = new Types.ObjectId(params.userId);
    }

    if (params.minRating !== undefined) {
      query.rating = query.rating || {};
      query.rating.$gte = params.minRating;
    }

    if (params.maxRating !== undefined) {
      query.rating = query.rating || {};
      query.rating.$lte = params.maxRating;
    }

    const sortDirection = (params.sortOrder === 'ASC' ? 1 : -1) as SortOrder;
    const sortField = params.sortBy || 'createdAt';
    const sortCriteria: { [key: string]: SortOrder } = { [sortField]: sortDirection };

    const skip = ((params.page || 1) - 1) * (params.limit || 10);
    const limit = params.limit || 10;

    const [reviews, total, aggregateResult] = await Promise.all([
      Review.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName profilePicture')
        .populate('homestayId', 'name'),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { homestayId: new Types.ObjectId(homestayId) } },
        { $group: { _id: null, averageRating: { $avg: '$rating' } } }
      ])
    ]);

    const averageRating = aggregateResult[0]?.averageRating || 0;

    return {
      reviews,
      total,
      averageRating
    };
  }

  // Update a review
  async updateReview(
    reviewId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Không tìm thấy đánh giá');
    }

    if (review.userId.toString() !== userId) {
      throw new Error('Bạn không có quyền cập nhật đánh giá này');
    }

    review.rating = rating;
    review.comment = comment;

    await review.save();

    // Cập nhật rating trung bình của homestay
    await this.updateHomestayRating(review.homestayId.toString());

    return review.populate('userId', 'firstName lastName profilePicture');
  }

  // Delete a review
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Không tìm thấy đánh giá');
    }

    if (review.userId.toString() !== userId) {
      throw new Error('Bạn không có quyền xóa đánh giá này');
    }

    await review.deleteOne();

    // Cập nhật rating trung bình của homestay
    await this.updateHomestayRating(review.homestayId.toString());
  }

  // Add response to a review
  async addResponseToReview(
    reviewId: string,
    ownerId: string,
    response: string
  ): Promise<IReview> {
    const review = await Review.findById(reviewId).populate('homestayId');
    if (!review) {
      throw new Error('Không tìm thấy đánh giá');
    }

    const homestay = await Homestay.findById(review.homestayId);
    if (!homestay || homestay.hostId.toString() !== ownerId) {
      throw new Error('Bạn không có quyền phản hồi đánh giá này');
    }

    review.response = response;
    await review.save();

    return review.populate('userId', 'firstName lastName profilePicture');
  }

  // Private method to update homestay rating
  private async updateHomestayRating(homestayId: string): Promise<void> {
    const result = await Review.aggregate([
      { $match: { homestayId: new Types.ObjectId(homestayId) } },
      { 
        $group: { 
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    const { averageRating = 0, reviewCount = 0 } = result[0] || {};

    await Homestay.findByIdAndUpdate(homestayId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount
    });
  }
}

export default new ReviewService();
