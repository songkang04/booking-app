import { Between, ILike, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Homestay, HomestayStatus } from '../models/homestay';
import { User, UserRole } from '../models/user';
import type { CreateHomestayDto, UpdateHomestayDto, HomestaySearchParams } from '../dtos/homestay';

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
    const homestay = await this.homestayRepository.findOne({
      where: { id: homestayId },
      relations: ['owner'],
    });

    if (!homestay) {
      throw new Error('Homestay not found');
    }

    return homestay;
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
      query.andWhere('homestay.address ILIKE :location', { location: `%${location}%` });
    }

    // Add name filter
    if (name) {
      query.andWhere('homestay.name ILIKE :name', { name: `%${name}%` });
    }

    // Add amenities filter
    if (amenities && amenities.length > 0) {
      query.andWhere('homestay.amenities @> :amenities', { amenities: JSON.stringify(amenities) });
    }

    // Add status filter
    if (status) {
      query.andWhere('homestay.status = :status', { status });
    }

    // Add sorting
    query.orderBy(`homestay.${sortBy}`, sortOrder);

    // Add pagination
    query.skip((page - 1) * limit).take(limit);

    // Get results
    const [homestays, total] = await query.getManyAndCount();

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