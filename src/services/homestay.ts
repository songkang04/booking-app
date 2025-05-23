import { Homestay, IHomestay } from '../schemas/homestay.schema';
import { User } from '../schemas/user.schema';
import { Booking, BookingStatus } from '../schemas/booking.schema';
import { FilterQuery } from 'mongoose';

// Interface cho query để đảm bảo type safety
interface HomestayQuery extends FilterQuery<IHomestay> {
  isActive: boolean;
  $text?: { $search: string };
  city?: string;
  province?: string;
  price?: { $gte?: number; $lte?: number };
  capacity?: { $gte: number };
  amenities?: { $all: string[] };
  hostId?: string;
  _id?: { $nin: string[] };
}

export interface HomestayQueryOptions {
  search?: string;
  city?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  amenities?: string[];
  checkInDate?: Date;
  checkOutDate?: Date;
  page?: number;
  limit?: number;
  hostId?: string;
}

class HomestayService {
  async createHomestay(homestayData: Partial<IHomestay>): Promise<IHomestay> {
    // Kiểm tra xem host có tồn tại không
    if (homestayData.hostId) {
      const host = await User.findById(homestayData.hostId);
      if (!host) {
        throw new Error('Không tìm thấy thông tin chủ homestay');
      }
    }

    const homestay = new Homestay(homestayData);
    return homestay.save();
  }

  async getHomestayById(id: string): Promise<IHomestay | null> {
    return Homestay.findById(id).populate('hostId', 'firstName lastName email');
  }

  async updateHomestay(
    id: string,
    homestayData: Partial<IHomestay>
  ): Promise<IHomestay | null> {
    return Homestay.findByIdAndUpdate(
      id,
      { $set: homestayData },
      { new: true }
    );
  }

  async deleteHomestay(id: string): Promise<boolean> {
    // Kiểm tra xem có đặt phòng nào liên quan đến homestay này không
    const existingBookings = await Booking.findOne({
      homestayId: id,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
    });

    if (existingBookings) {
      throw new Error('Không thể xóa homestay này vì có đặt phòng liên quan');
    }

    const result = await Homestay.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async searchHomestays(options: HomestayQueryOptions): Promise<{
    homestays: IHomestay[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
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
        page = 1,
        limit = 10,
        hostId,
      } = options;

      // Validate input
      if (page < 1 || limit < 1) {
        throw new Error('Invalid pagination parameters');
      }

      if (checkInDate && checkOutDate && new Date(checkInDate) >= new Date(checkOutDate)) {
        throw new Error('Invalid date range');
      }

      const query: HomestayQuery = { isActive: true };

      if (search) {
        query.$text = { $search: search };
      }

      if (city) {
        query.city = city;
      }

      if (province) {
        query.province = province;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }

      if (capacity) {
        query.capacity = { $gte: capacity };
      }

      if (amenities?.length) {
        query.amenities = { $all: amenities };
      }

      if (hostId) {
        query.hostId = hostId;
      }

      const skip = (page - 1) * limit;

      // Handle date filtering
      if (checkInDate && checkOutDate) {
        const overlappingBookings = await Booking.find({
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
          $or: [
            {
              checkInDate: { $lte: new Date(checkInDate) },
              checkOutDate: { $gt: new Date(checkInDate) },
            },
            {
              checkInDate: { $lt: new Date(checkOutDate) },
              checkOutDate: { $gte: new Date(checkOutDate) },
            },
            {
              checkInDate: { $gte: new Date(checkInDate) },
              checkOutDate: { $lte: new Date(checkOutDate) },
            },
          ],
        }).select('homestayId');

        const bookedHomestayIds = overlappingBookings.map(booking => 
          booking.homestayId.toString()
        );

        if (bookedHomestayIds.length) {
          query._id = { $nin: bookedHomestayIds };
        }
      }

      // Optimize by running queries in parallel
      const [total, homestays] = await Promise.all([
        Homestay.countDocuments(query),
        Homestay.find(query)
          .select(search ? { score: { $meta: 'textScore' } } : {})
          .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('hostId', 'firstName lastName email')
          .lean()
      ]);

      const pages = Math.ceil(total / limit);

      return {
        homestays,
        total,
        page,
        limit,
        pages,
      };
    } catch (error: any) {
      throw new Error(`Error searching homestays: ${error.message}`);
    }
  }

  async getFeaturedHomestays(limit: number = 6): Promise<IHomestay[]> {
    // Lấy homestay có điểm đánh giá cao
    return Homestay.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(limit)
      .populate('hostId', 'firstName lastName email');
  }

  async getPopularLocations(): Promise<{ city: string; count: number }[]> {
    return Homestay.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $project: { city: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
  }

  async updateHomestayRating(homestayId: string): Promise<void> {
    // Tính toán lại điểm đánh giá dựa trên reviews
    const result = await Booking.aggregate([
      {
        $match: {
          homestayId: homestayId,
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$homestayId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      const { averageRating, reviewCount } = result[0];
      await Homestay.findByIdAndUpdate(homestayId, {
        rating: averageRating,
        reviewCount
      });
    }
  }

  async countHomestays(): Promise<number> {
    return Homestay.countDocuments({ isActive: true });
  }
}

export default new HomestayService();
