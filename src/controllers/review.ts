import { Request, Response } from 'express';
import { Types } from 'mongoose';
import reviewService from '../services/review';
import { createResponse } from '../utils/function';
import type { CreateReviewDto, UpdateReviewDto, ReviewSearchParams } from '../dtos/review';

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const reviewData: CreateReviewDto = req.body;
    
    // Validate rating
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      return res.status(400).json(createResponse(false, 'Đánh giá phải từ 1 đến 5 sao'));
    }

    // Validate comment
    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      return res.status(400).json(createResponse(false, 'Nội dung đánh giá không được để trống'));
    }

    // Validate homestayId
    if (!reviewData.homestayId || !Types.ObjectId.isValid(reviewData.homestayId)) {
      return res.status(400).json(createResponse(false, 'ID homestay không hợp lệ'));
    }

    const review = await reviewService.createReview(
      userId,
      reviewData.homestayId,
      reviewData.rating,
      reviewData.comment.trim()
    );
    
    return res.status(201).json(createResponse(true, 'Đã tạo đánh giá thành công', review));
  } catch (error) {
    console.error('Lỗi khi tạo đánh giá:', error);
    if (error instanceof Error) {
      if (error.message.includes('đã đánh giá')) {
        return res.status(400).json(createResponse(false, error.message));
      }
      if (error.message.includes('không tồn tại')) {
        return res.status(404).json(createResponse(false, error.message));
      }
      if (error.message.includes('chưa đặt phòng')) {
        return res.status(403).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi tạo đánh giá'));
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const reviewId = req.params.id;
    if (!Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json(createResponse(false, 'ID đánh giá không hợp lệ'));
    }

    const updateData: UpdateReviewDto = req.body;
    
    // Validate rating if provided
    if (updateData.rating !== undefined) {
      if (updateData.rating < 1 || updateData.rating > 5) {
        return res.status(400).json(createResponse(false, 'Đánh giá phải từ 1 đến 5 sao'));
      }
    }

    // Validate comment if provided
    if (updateData.comment !== undefined) {
      if (updateData.comment.trim().length === 0) {
        return res.status(400).json(createResponse(false, 'Nội dung đánh giá không được để trống'));
      }
    }

    // If neither rating nor comment is provided, return error
    if (updateData.rating === undefined && updateData.comment === undefined) {
      return res.status(400).json(createResponse(false, 'Cần cung cấp rating hoặc comment để cập nhật'));
    }

    const review = await reviewService.updateReview(
      reviewId,
      userId,
      updateData.rating || 0, // Service will only update if rating is provided
      updateData.comment?.trim() || '' // Service will only update if comment is provided
    );
    
    return res.json(createResponse(true, 'Đã cập nhật đánh giá thành công', review));
  } catch (error) {
    console.error('Lỗi khi cập nhật đánh giá:', error);
    if (error instanceof Error) {
      if (error.message.includes('không có quyền')) {
        return res.status(403).json(createResponse(false, error.message));
      }
      if (error.message.includes('không tìm thấy')) {
        return res.status(404).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi cập nhật đánh giá'));
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const reviewId = req.params.id;
    if (!Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json(createResponse(false, 'ID đánh giá không hợp lệ'));
    }

    await reviewService.deleteReview(reviewId, userId);
    return res.json(createResponse(true, 'Đã xóa đánh giá thành công'));
  } catch (error) {
    console.error('Lỗi khi xóa đánh giá:', error);
    if (error instanceof Error) {
      if (error.message.includes('không có quyền')) {
        return res.status(403).json(createResponse(false, error.message));
      }
      if (error.message.includes('không tìm thấy')) {
        return res.status(404).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi xóa đánh giá'));
  }
};

export const getHomestayReviews = async (req: Request, res: Response) => {
  try {
    const homestayId = req.params.homestayId;
    if (!Types.ObjectId.isValid(homestayId)) {
      return res.status(400).json(createResponse(false, 'ID homestay không hợp lệ'));
    }

    // Validate and parse query parameters
    const params: ReviewSearchParams = {
      userId: req.query.userId && Types.ObjectId.isValid(req.query.userId as string) 
        ? req.query.userId as string 
        : undefined,
      minRating: req.query.minRating ? Math.max(1, Math.min(5, parseFloat(req.query.minRating as string))) : undefined,
      maxRating: req.query.maxRating ? Math.max(1, Math.min(5, parseFloat(req.query.maxRating as string))) : undefined,
      page: req.query.page ? Math.max(1, parseInt(req.query.page as string)) : 1,
      limit: req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string))) : 10,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    // Validate minRating and maxRating relationship
    if (params.minRating !== undefined && params.maxRating !== undefined && params.minRating > params.maxRating) {
      return res.status(400).json(createResponse(false, 'Giá trị minRating không thể lớn hơn maxRating'));
    }

    const { reviews, total, averageRating } = await reviewService.getHomestayReviews(homestayId, params);
    
    return res.json(createResponse(true, 'Đã lấy danh sách đánh giá thành công', {
      data: reviews,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / (params.limit || 10)),
        averageRating: Math.round(averageRating * 10) / 10
      }
    }));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy danh sách đánh giá'));
  }
};

export const responseToReview = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId || !Types.ObjectId.isValid(ownerId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const reviewId = req.params.id;
    if (!Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json(createResponse(false, 'ID đánh giá không hợp lệ'));
    }

    const { response } = req.body;
    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      return res.status(400).json(createResponse(false, 'Nội dung phản hồi không hợp lệ'));
    }
    
    const review = await reviewService.addResponseToReview(reviewId, ownerId, response.trim());
    return res.json(createResponse(true, 'Đã phản hồi đánh giá thành công', review));
  } catch (error) {
    console.error('Lỗi khi phản hồi đánh giá:', error);
    if (error instanceof Error) {
      if (error.message.includes('không có quyền')) {
        return res.status(403).json(createResponse(false, error.message));
      }
      if (error.message.includes('không tìm thấy')) {
        return res.status(404).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi phản hồi đánh giá'));
  }
};
