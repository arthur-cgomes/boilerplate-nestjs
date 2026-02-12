jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoginAttemptService } from '../services/login-attempt.service';
import { LoginAttempt } from '../entity/login-attempt.entity';
import {
  MockRepository,
  repositoryMockFactory,
} from '../../common/utils/test.util';
import { mockLoginAttempt, mockUser } from './mocks/auth.mock';

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;
  let repositoryMock: MockRepository<LoginAttempt>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginAttemptService,
        {
          provide: getRepositoryToken(LoginAttempt),
          useValue: repositoryMockFactory<LoginAttempt>(),
        },
      ],
    }).compile();

    service = module.get<LoginAttemptService>(LoginAttemptService);
    repositoryMock = module.get(getRepositoryToken(LoginAttempt));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordAttempt', () => {
    it('Should record a failed login attempt', async () => {
      repositoryMock.create.mockReturnValue(mockLoginAttempt);
      repositoryMock.save.mockResolvedValue(mockLoginAttempt);

      await service.recordAttempt(
        mockUser.email,
        false,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        email: mockUser.email,
        successful: false,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it('Should record a successful login attempt and clear failed attempts', async () => {
      const successAttempt = { ...mockLoginAttempt, successful: true };
      repositoryMock.create.mockReturnValue(successAttempt);
      repositoryMock.save.mockResolvedValue(successAttempt);
      repositoryMock.delete.mockResolvedValue({ affected: 3 });

      await service.recordAttempt(mockUser.email, true, '127.0.0.1');

      expect(repositoryMock.create).toHaveBeenCalledWith({
        email: mockUser.email,
        successful: true,
        ipAddress: '127.0.0.1',
        userAgent: undefined,
      });
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(repositoryMock.delete).toHaveBeenCalledWith({
        email: mockUser.email,
        successful: false,
      });
    });
  });

  describe('isAccountLocked', () => {
    it('Should return locked: false when failed attempts < 5', async () => {
      repositoryMock.count.mockResolvedValue(3);

      const result = await service.isAccountLocked(mockUser.email);

      expect(result).toEqual({ locked: false });
    });

    it('Should return locked: true when failed attempts >= 5 and within lockout duration', async () => {
      const recentAttempt = {
        ...mockLoginAttempt,
        createdAt: new Date(),
      };
      repositoryMock.count.mockResolvedValue(5);
      repositoryMock.findOne.mockResolvedValue(recentAttempt);

      const result = await service.isAccountLocked(mockUser.email);

      expect(result.locked).toBe(true);
      expect(result.remainingMs).toBeDefined();
      expect(result.remainingMs).toBeGreaterThan(0);
    });

    it('Should return locked: false when lockout duration has expired', async () => {
      const oldAttempt = {
        ...mockLoginAttempt,
        createdAt: new Date(Date.now() - 31 * 60 * 1000),
      };
      repositoryMock.count.mockResolvedValue(5);
      repositoryMock.findOne.mockResolvedValue(oldAttempt);

      const result = await service.isAccountLocked(mockUser.email);

      expect(result).toEqual({ locked: false });
    });

    it('Should return locked: false when no last attempt found', async () => {
      repositoryMock.count.mockResolvedValue(5);
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.isAccountLocked(mockUser.email);

      expect(result).toEqual({ locked: false });
    });
  });

  describe('getRecentFailedAttempts', () => {
    it('Should count failed attempts within the lockout window', async () => {
      repositoryMock.count.mockResolvedValue(3);

      const result = await service.getRecentFailedAttempts(mockUser.email);

      expect(repositoryMock.count).toHaveBeenCalledWith({
        where: {
          email: mockUser.email,
          successful: false,
          createdAt: expect.anything(),
        },
      });
      expect(result).toBe(3);
    });

    it('Should return 0 when no failed attempts found', async () => {
      repositoryMock.count.mockResolvedValue(0);

      const result = await service.getRecentFailedAttempts(mockUser.email);

      expect(result).toBe(0);
    });
  });
});
