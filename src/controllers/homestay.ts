import { Request, Response } from 'express';
import { Types } from 'mongoose';
import homestayService from '../services/homestay';
import { createResponse } from '../utils/function';

// Tạo homestay mới
export const createHomestay = async (req: Request, res: Response) => {
  try {
    const homestayData = req.body;
    
    // Gán hostId là người dùng hiện tại
    homestayData.hostId = req.user?.id;

    const homestay = await homestayService.createHomestay(homestayData);
    
    return res.status(201).json(
      createResponse(true, 'Tạo homestay thành công', { homestay })
    );
  } catch (error) {
    console.error('Lỗi tạo homestay:', error);
    return res.status(500).json(
      createResponse(false, 'Lỗi khi tạo homestay')
    );
  }
};

// Cập nhật homestay
export const updateHomestay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const homestayData = req.body;
    
    // Kiểm tra xem homestay có tồn tại không
    const existingHomestay = await homestayService.getHomestayById(id);
    if (!existingHomestay) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy homestay')
      );
    }
    
    // Kiểm tra quyền sở hữu (nếu không phải admin)
    if (req.user?.role !== 'admin' && existingHomestay.hostId.toString() !== req.user?.id) {
      return res.status(403).json(
        createResponse(false, 'Không có quyền cập nhật homestay này')
      );
    }
    
    const updatedHomestay = await homestayService.updateHomestay(id, homestayData);
    
    return res.json(
      createResponse(true, 'Cập nhật homestay thành công', { homestay: updatedHomestay })
    );
  } catch (error) {
    console.error('Lỗi cập nhật homestay:', error);
    return res.status(500).json(
      createResponse(false, 'Lỗi khi cập nhật homestay')
    );
  }
};

// Xóa homestay
export const deleteHomestay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem homestay có tồn tại không
    const existingHomestay = await homestayService.getHomestayById(id);
    if (!existingHomestay) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy homestay')
      );
    }
    
    // Kiểm tra quyền sở hữu (nếu không phải admin)
    if (req.user?.role !== 'admin' && existingHomestay.hostId.toString() !== req.user?.id) {
      return res.status(403).json(
        createResponse(false, 'Không có quyền xóa homestay này')
      );
    }
    
    await homestayService.deleteHomestay(id);
    
    return res.json(
      createResponse(true, 'Xóa homestay thành công')
    );
  } catch (error) {
    console.error('Lỗi xóa homestay:', error);
    
    if (error instanceof Error && error.message === 'Không thể xóa homestay này vì có đặt phòng liên quan') {
      return res.status(400).json(
        createResponse(false, error.message)
      );
    }
    
    return res.status(500).json(
      createResponse(false, 'Lỗi khi xóa homestay')
    );
  }
};

// Lấy homestay theo ID
export const getHomestayById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const homestay = await homestayService.getHomestayById(id);
    
    if (!homestay) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy homestay')
      );
    }
    
    return res.json(
      createResponse(true, 'Lấy thông tin homestay thành công', { homestay })
    );
  } catch (error) {
    console.error('Lỗi lấy thông tin homestay:', error);
    return res.status(500).json(
      createResponse(false, 'Lỗi khi lấy thông tin homestay')
    );
  }
};

// Tìm kiếm homestay
export const searchHomestays = async (req: Request, res: Response) => {
  try {
    const {
      search,
      city,
      province,
      minPrice,
      maxPrice,
      capacity,
      amenities,
      checkInDate,
      checkOutDate,
      page = '1',
      limit = '10',
    } = req.query;
    
    const options = {
      search: search as string,
      city: city as string,
      province: province as string,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      capacity: capacity ? parseInt(capacity as string) : undefined,
      amenities: amenities ? (amenities as string).split(',') : undefined,
      checkInDate: checkInDate ? new Date(checkInDate as string) : undefined,
      checkOutDate: checkOutDate ? new Date(checkOutDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };
    
    const result = await homestayService.searchHomestays(options);
    
    return res.json(
      createResponse(true, 'Tìm kiếm homestay thành công', result)
    );
  } catch (error) {
    console.error('Lỗi tìm kiếm homestay:', error);
    return res.status(500).json(
      createResponse(false, 'Lỗi khi tìm kiếm homestay')
    );
  }
};

// Lấy homestay của chủ hiện tại
export const getMyHomestays = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = '1', limit = '10' } = req.query;
    
    const options = {
      hostId: userId,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };
    
    const result = await homestayService.searchHomestays(options);
    
    return res.json(
      createResponse(true, 'Lấy danh sách homestay của bạn thành công', result)
    );
  } catch (error) {
    console.error('Lỗi lấy homestay của chủ:', error);
    return res.status(500).json(
      createResponse(false, 'Lỗi khi lấy danh sách homestay của bạn')
    );
  }
};

// Lấy các homestay tương tự
export const getSimilarHomestays = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    
    // Lấy thông tin homestay hiện tại
    const currentHomestay = await homestayService.getHomestayById(id);
    if (!currentHomestay) {
      return res.status(404).json(
        createResponse(false, 'Không tìm thấy homestay')
      );
    }
    
    // Tìm các homestay cùng thành phố và có giá tương đương
    const options = {
      city: currentHomestay.city,
      minPrice: currentHomestay.price * 0.7,  // Giá từ 70%
      maxPrice: currentHomestay.price * 1.3,  // Giá đến 130%
      limit,
    };
    
    // Loại bỏ homestay hiện tại khỏi kết quả
    const result = await homestayService.searchHomestays(options);
    const filteredHomestays = result.homestays.filter(
      homestay => homestay._id && homestay._id.toString() !== id
    );
    
    return res.json(
      createResponse(true, 'Lấy homestay tương tự thành công', { 
        homestays: filteredHomestays.slice(0, limit),
        total: filteredHomestays.length
      })
    );
  } catch (error) {
    console.error('Lỗi lấy homestay tương tự:', error);
    return res.status(500).json(
      createResponse(false, 'Lỗi khi lấy homestay tương tự')
    );
  }
};