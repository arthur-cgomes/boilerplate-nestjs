import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from './entity/user.entity';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetAllResponseDto } from '../common/dto/get-all.dto';
import { ERROR_MESSAGES, APP_CONSTANTS } from '../common/constants';
import { AuthProvider } from '../common/enum/auth-provider.enum';

const CACHE_PREFIX = 'user:';

const ALLOWED_SORT_FIELDS = [
  'name',
  'email',
  'createdAt',
  'updatedAt',
  'lastLogin',
  'firstLogin',
  'userType',
];

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async checkUserToLogin(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, active: true },
      select: ['id', 'email', 'password', 'name', 'userType'],
    });

    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);

    await this.updateLoginTimestamps(user.id);

    return user;
  }

  private async updateLoginTimestamps(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstLogin'],
    });

    const now = new Date();
    const updateData: { lastLogin: Date; firstLogin?: Date } = {
      lastLogin: now,
    };

    if (user && !user.firstLogin) {
      updateData.firstLogin = now;
    }

    await this.userRepository.update(userId, updateData);
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `${CACHE_PREFIX}email:${email}`;

    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findOne({
      where: { email, active: true },
    });

    if (user) {
      await this.cacheManager.set(cacheKey, user, APP_CONSTANTS.CACHE.USER_TTL);
    }

    return user;
  }

  async findByProviderId(providerId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { providerId, active: true },
    });
  }

  async createOrUpdateSocialUser(data: {
    email: string;
    name: string;
    providerId: string;
    authProvider: AuthProvider;
    avatarUrl?: string;
  }): Promise<User> {
    const now = new Date();
    let user = await this.findByProviderId(data.providerId);

    if (user) {
      if (!user.firstLogin) {
        user.firstLogin = now;
      }
      user.lastLogin = now;
      if (data.avatarUrl) {
        user.avatarUrl = data.avatarUrl;
      }
      return this.userRepository.save(user);
    }

    user = await this.findByEmail(data.email);

    if (user) {
      user.providerId = data.providerId;
      user.authProvider = data.authProvider;
      if (!user.firstLogin) {
        user.firstLogin = now;
      }
      user.lastLogin = now;
      if (data.avatarUrl) {
        user.avatarUrl = data.avatarUrl;
      }
      return this.userRepository.save(user);
    }

    const newUser = this.userRepository.create({
      email: data.email,
      name: data.name,
      providerId: data.providerId,
      authProvider: data.authProvider,
      avatarUrl: data.avatarUrl || null,
      firstLogin: now,
      lastLogin: now,
    });

    return this.userRepository.save(newUser);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.getUserById(userId);
    user.password = newPassword;
    await this.userRepository.save(user);
  }

  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    const checkUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (checkUser) {
      if (!checkUser.active) {
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_DELETED);
      }
      throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_EXISTS);
    }

    return await this.userRepository.create(createUserDto).save();
  }

  public async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const existingUser = await this.getUserById(userId);

    const updatedUser = await (
      await this.userRepository.preload({
        id: userId,
        ...updateUserDto,
      })
    ).save();

    await this.invalidateUserCache(userId, existingUser.email);

    return updatedUser;
  }

  public async getUserById(userId: string): Promise<User> {
    const cacheKey = `${CACHE_PREFIX}id:${userId}`;

    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    await this.cacheManager.set(cacheKey, user, APP_CONSTANTS.CACHE.USER_TTL);

    return user;
  }

  public async getAllUsers(
    take: number,
    skip: number,
    search: string,
    sort: string,
    order: 'ASC' | 'DESC',
  ): Promise<GetAllResponseDto<User>> {
    const validSort = ALLOWED_SORT_FIELDS.includes(sort) ? sort : 'createdAt';

    const conditions: FindManyOptions<User> = {
      take,
      skip,
      where: {
        active: true,
      },
      order: {
        [validSort]: order,
      },
    };

    if (search) {
      conditions.where = {
        ...conditions.where,
        name: ILike(`%${search}%`),
      };
    }

    const [items, count] = await this.userRepository.findAndCount(conditions);

    if (items.length == 0) {
      return { skip: null, total: 0, items };
    }
    const over = count - Number(take) - Number(skip);
    skip = over <= 0 ? null : Number(skip) + Number(take);

    return { skip, total: count, items };
  }

  public async deleteUser(userId: string): Promise<string> {
    const user = await this.getUserById(userId);

    user.active = false;
    user.deleteAt = new Date().toISOString();
    await this.userRepository.save(user);

    await this.invalidateUserCache(userId, user.email);

    return 'removed';
  }

  private async invalidateUserCache(
    userId: string,
    email: string,
  ): Promise<void> {
    await Promise.all([
      this.cacheManager.del(`${CACHE_PREFIX}id:${userId}`),
      this.cacheManager.del(`${CACHE_PREFIX}email:${email}`),
    ]);
  }
}
