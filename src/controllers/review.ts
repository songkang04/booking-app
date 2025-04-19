import { Request, Response } from 'express';
import reviewService from '../services/review';
import { createResponse } from '../utils/function';
import type { CreateReviewDto, UpdateReviewDto, ReviewSearchParams } from '../dtos/review';

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const reviewData: CreateReviewDto = req.body;
    const review = await reviewService.createReview(userId, reviewData);
    
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
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi tạo đánh giá'));
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const reviewId = parseInt(req.params.id);
    const updateData: UpdateReviewDto = req.body;
    
    const review = await reviewService.updateReview(reviewId, userId, updateData);
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
    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const reviewId = parseInt(req.params.id);
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
    const homestayId = parseInt(req.params.homestayId);
    
    const params: ReviewSearchParams = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };
    
    const [reviews, total] = await reviewService.getHomestayReviews(homestayId, params);
    
    // Tính toán đánh giá trung bình
    const averageRating = await reviewService.getAverageRating(homestayId);
    
    return res.json(createResponse(true, 'Đã lấy danh sách đánh giá thành công', {
      data: reviews,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / (params.limit || 10)),
        averageRating
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
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const reviewId = parseInt(req.params.id);
    const { response } = req.body;
    
    if (!response || typeof response !== 'string') {
      return res.status(400).json(createResponse(false, 'Phản hồi không hợp lệ'));
    }
    
    const review = await reviewService.responseToReview(reviewId, ownerId, response);
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
