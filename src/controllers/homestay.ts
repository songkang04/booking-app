import { Request, Response } from 'express';
import homestayService from '../services/homestay';
import { createResponse } from '../utils/function';
import type { CreateHomestayDto, UpdateHomestayDto, HomestaySearchParams } from '../dtos/homestay';

export const createHomestay = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }

    const homestayData: CreateHomestayDto = req.body;
    const homestay = await homestayService.createHomestay(ownerId, homestayData);
    
    return res.status(201).json(createResponse(true, 'Homestay created successfully', homestay));
  } catch (error) {
    console.error('Error creating homestay:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return res.status(403).json(createResponse(false, error.message));
    }
    return res.status(500).json(createResponse(false, 'Error creating homestay'));
  }
};

export const updateHomestay = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }

    const homestayId = parseInt(req.params.id);
    const updateData: UpdateHomestayDto = req.body;
    
    const homestay = await homestayService.updateHomestay(homestayId, ownerId, updateData);
    return res.json(createResponse(true, 'Homestay updated successfully', homestay));
  } catch (error) {
    console.error('Error updating homestay:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json(createResponse(false, error.message));
      }
      if (error.message === 'Homestay not found') {
        return res.status(404).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Error updating homestay'));
  }
};

export const deleteHomestay = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }

    const homestayId = parseInt(req.params.id);
    await homestayService.deleteHomestay(homestayId, ownerId);
    
    return res.json(createResponse(true, 'Homestay deleted successfully'));
  } catch (error) {
    console.error('Error deleting homestay:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json(createResponse(false, error.message));
      }
      if (error.message === 'Homestay not found') {
        return res.status(404).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Error deleting homestay'));
  }
};

export const getHomestay = async (req: Request, res: Response) => {
  try {
    const homestayId = parseInt(req.params.id);
    const homestay = await homestayService.getHomestay(homestayId);
    
    return res.json(createResponse(true, 'Homestay retrieved successfully', homestay));
  } catch (error) {
    console.error('Error retrieving homestay:', error);
    if (error instanceof Error && error.message === 'Homestay not found') {
      return res.status(404).json(createResponse(false, error.message));
    }
    return res.status(500).json(createResponse(false, 'Error retrieving homestay'));
  }
};

export const searchHomestays = async (req: Request, res: Response) => {
  try {
    const searchParams: HomestaySearchParams = {
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string,
      amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    const result = await homestayService.searchHomestays(searchParams);
    return res.json(createResponse(true, 'Homestays retrieved successfully', result));
  } catch (error) {
    console.error('Error searching homestays:', error);
    return res.status(500).json(createResponse(false, 'Error searching homestays'));
  }
};

export const getMyHomestays = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json(createResponse(false, 'Authentication required'));
    }

    const homestays = await homestayService.getOwnerHomestays(ownerId);
    return res.json(createResponse(true, 'Owner homestays retrieved successfully', homestays));
  } catch (error) {
    console.error('Error retrieving owner homestays:', error);
    return res.status(500).json(createResponse(false, 'Error retrieving owner homestays'));
  }
};