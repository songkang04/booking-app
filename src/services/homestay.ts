import { Between, ILike, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Homestay, HomestayStatus } from '../models/homestay';
import { User, UserRole } from '../models/user';
import type { CreateHomestayDto, UpdateHomestayDto, HomestaySearchParams } from '../dtos/homestay';
import { AllAmenities, isValidAmenity } from '../constants/amenities';

class HomestayService {
  private homestayRepository: Repository<Homestay>;
  private userRepository: Repository<User>;

  constructor() {
    this.homestayRepository = AppDataSource.getRepository(Homestay);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createHomestay(ownerId: number, createData: CreateHomestayDto): Promise<Homestay> {
    const owner = await this.userRepository.findOneBy({ id: ownerId });
    if (!owner || owner.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Only admins can create homestays');
    }

    // Đảm bảo chỉ lưu các tiện nghi hợp lệ
    if (createData.amenities && createData.amenities.length > 0) {
      createData.amenities = createData.amenities.filter(amenity => isValidAmenity(amenity));
    }

    const homestay = this.homestayRepository.create({
      ...createData,
      ownerID: ownerId,
    });

    return await this.homestayRepository.save(homestay);
  }

  async updateHomestay(
    homestayId: number,
    ownerId: number,
    updateData: UpdateHomestayDto
  ): Promise<Homestay> {
    const homestay = await this.homestayRepository.findOne({
      where: { id: homestayId },
      relations: ['owner'],
    });

    if (!homestay) {
      throw new Error('Homestay not found');
    }

    if (homestay.ownerID !== ownerId) {
      throw new Error('Unauthorized: You can only update your own homestays');
    }

    // Đảm bảo chỉ lưu các tiện nghi hợp lệ
    if (updateData.amenities && updateData.amenities.length > 0) {
      updateData.amenities = updateData.amenities.filter(amenity => isValidAmenity(amenity));
    }

    Object.assign(homestay, updateData);
    return await this.homestayRepository.save(homestay);
  }

  async deleteHomestay(homestayId: number, ownerId: number): Promise<void> {
    const homestay = await this.homestayRepository.findOneBy({ id: homestayId });

    if (!homestay) {
      throw new Error('Homestay not found');
    }

    if (homestay.ownerID !== ownerId) {
      throw new Error('Unauthorized: You can only delete your own homestays');
    }

    await this.homestayRepository.remove(homestay);
  }

  async getHomestay(homestayId: number): Promise<Homestay> {
    const homestay = await this.getHomestayById(homestayId);

    if (!homestay) {
      throw new Error('Homestay not found');
    }

    return homestay;
  }

  async getHomestayById(id: number): Promise<Homestay | null> {
    try {
      const homestay = await this.homestayRepository.findOne({
        where: { id, status: HomestayStatus.ACTIVE },
        relations: ['owner'],
      });
      
      return homestay;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin homestay:', error);
      throw new Error('Không thể lấy thông tin homestay');
    }
  }

  async getSimilarHomestays(id: number, limit: number = 4): Promise<Homestay[]> {
    try {
      const homestay = await this.getHomestayById(id);
      
      if (!homestay) {
        return [];
      }
      
      // Tìm homestay tương tự dựa trên location và tầm giá ±30%
      const minPrice = homestay.price * 0.7;
      const maxPrice = homestay.price * 1.3;
      
      const query = this.homestayRepository.createQueryBuilder('homestay')
        .where('homestay.id != :id', { id })
        .andWhere('homestay.status = :status', { status: HomestayStatus.ACTIVE })
        .andWhere('homestay.location = :location', { location: homestay.location })
        .andWhere('homestay.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice })
        .orderBy('RANDOM()')
        .take(limit);
      
      return await query.getMany();
    } catch (error) {
      console.error('Lỗi khi lấy danh sách homestay tương tự:', error);
      return [];
    }
  }

  async searchHomestays(params: HomestaySearchParams) {
    const {
      minPrice,
      maxPrice,
      location,
      name,
      amenities,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    console.log('Search params received:', params);

    const query = this.homestayRepository.createQueryBuilder('homestay');

    // Add price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.andWhere('homestay.price BETWEEN :minPrice AND :maxPrice', {
        minPrice: minPrice || 0,
        maxPrice: maxPrice || Number.MAX_SAFE_INTEGER,
      });
    }

    // Add location filter
    if (location) {
      query.andWhere('LOWER(homestay.address) LIKE LOWER(:location)', { location: `%${location}%` });
    }

    // Add name filter
    if (name) {
      console.log('Searching by name:', name);
      query.andWhere('LOWER(homestay.name) LIKE LOWER(:name)', { name: `%${name}%` });
    }

    // Add amenities filter
    if (amenities && amenities.length > 0) {
      console.log('Tìm kiếm theo tiện nghi:', amenities);
      
      // Chỉ tìm kiếm các tiện nghi hợp lệ
      const validAmenities = amenities.filter(amenity => isValidAmenity(amenity));
      
      // Sử dụng LIKE cho mỗi tiện nghi - cách tiếp cận tương thích hơn
      validAmenities.forEach((amenity, index) => {
        query.andWhere(`homestay.amenities LIKE :amenity${index}`, { [`amenity${index}`]: `%${amenity}%` });
      });
    }

    // Add status filter
    if (status) {
      query.andWhere('homestay.status = :status', { status });
    }

    // Add sorting
    query.orderBy(`homestay.${sortBy}`, sortOrder);

    // Add pagination
    query.skip((page - 1) * limit).take(limit);

    // Log the final query
    console.log('Final query:', query.getSql());

    // Get results
    const [homestays, total] = await query.getManyAndCount();
    console.log(`Found ${total} homestays`);

    return {
      homestays,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOwnerHomestays(ownerId: number) {
    return await this.homestayRepository.find({
      where: { ownerID: ownerId },
      order: { createdAt: 'DESC' },
    });
  }
}

export default new HomestayService();