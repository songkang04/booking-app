import { Request, Response } from 'express';
import homestayService from '../services/homestay';
import { createResponse } from '../utils/function';
import type { CreateHomestayDto, UpdateHomestayDto, HomestaySearchParams } from '../dtos/homestay';
import { isValidAmenity } from '../constants/amenities';

export const createHomestay = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const homestayData: CreateHomestayDto = req.body;
    const homestay = await homestayService.createHomestay(ownerId, homestayData);
    
    return res.status(201).json(createResponse(true, 'Đã tạo homestay thành công', homestay));
  } catch (error) {
    console.error('Error creating homestay:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return res.status(403).json(createResponse(false, 'Không có quyền truy cập'));
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi tạo homestay'));
  }
};

export const updateHomestay = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const homestayId = parseInt(req.params.id);
    const updateData: UpdateHomestayDto = req.body;
    
    const homestay = await homestayService.updateHomestay(homestayId, ownerId, updateData);
    return res.json(createResponse(true, 'Đã cập nhật homestay thành công', homestay));
  } catch (error) {
    console.error('Error updating homestay:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json(createResponse(false, 'Không có quyền truy cập'));
      }
      if (error.message === 'Homestay not found') {
        return res.status(404).json(createResponse(false, 'Không tìm thấy homestay'));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi cập nhật homestay'));
  }
};

export const deleteHomestay = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const homestayId = parseInt(req.params.id);
    await homestayService.deleteHomestay(homestayId, ownerId);
    
    return res.json(createResponse(true, 'Đã xóa homestay thành công'));
  } catch (error) {
    console.error('Error deleting homestay:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json(createResponse(false, 'Không có quyền truy cập'));
      }
      if (error.message === 'Homestay not found') {
        return res.status(404).json(createResponse(false, 'Không tìm thấy homestay'));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi xóa homestay'));
  }
};

export const getHomestay = async (req: Request, res: Response) => {
  try {
    const homestayId = parseInt(req.params.id);
    const homestay = await homestayService.getHomestay(homestayId);
    
    return res.json(createResponse(true, 'Đã lấy thông tin homestay thành công', homestay));
  } catch (error) {
    console.error('Error retrieving homestay:', error);
    if (error instanceof Error && error.message === 'Homestay not found') {
      return res.status(404).json(createResponse(false, 'Không tìm thấy homestay'));
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thông tin homestay'));
  }
};

export const getHomestayById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const homestay = await homestayService.getHomestayById(parseInt(id));
    
    if (!homestay) {
      return res.status(404).json(createResponse(false, 'Không tìm thấy homestay'));
    }
    
    return res.json(createResponse(true, 'Lấy thông tin homestay thành công', {
      data: homestay
    }));
  } catch (error) {
    console.error('Lỗi khi lấy thông tin homestay:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thông tin homestay'));
  }
};

export const getSimilarHomestays = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    const similarHomestays = await homestayService.getSimilarHomestays(
      parseInt(id),
      parseInt(limit as string)
    );
    
    return res.json(createResponse(true, 'Lấy danh sách homestay tương tự thành công', {
      data: similarHomestays
    }));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách homestay tương tự:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy danh sách homestay tương tự'));
  }
};

export const searchHomestays = async (req: Request, res: Response) => {
  try {
    // Xử lý amenities - kiểm tra tính hợp lệ của các tiện nghi
    let validAmenities: string[] | undefined = undefined;
    
    if (req.query.amenities) {
      const requestedAmenities = (req.query.amenities as string).split(',');
      validAmenities = requestedAmenities.filter(amenity => isValidAmenity(amenity));
      
      if (validAmenities.length !== requestedAmenities.length) {
        console.log('Đã lọc các tiện nghi không hợp lệ:', 
          requestedAmenities.filter(amenity => !isValidAmenity(amenity)));
      }
      
      console.log('Tìm kiếm với tiện nghi hợp lệ:', validAmenities);
    }

    const searchParams: HomestaySearchParams = {
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string,
      name: req.query.name as string,
      amenities: validAmenities,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    const result = await homestayService.searchHomestays(searchParams);
    return res.json(createResponse(true, 'Đã lấy danh sách homestay thành công', {
      data: result
    }));
  } catch (error) {
    console.error('Lỗi khi tìm kiếm homestay:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi tìm kiếm homestay'));
  }
};

export const getMyHomestays = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const homestays = await homestayService.getOwnerHomestays(ownerId);
    return res.json(createResponse(true, 'Đã lấy danh sách homestay của chủ sở hữu thành công', homestays));
  } catch (error) {
    console.error('Error retrieving owner homestays:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy danh sách homestay của chủ sở hữu'));
  }
};