import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
  const hashing = { hash: jest.fn(), compare: jest.fn() };
  const tokens = {
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };
  const mailQueue = { add: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as never,
      hashing as never,
      tokens as never,
      mailQueue as never,
    );
  });

  it('hashes and registers a user, then issues tokens and a welcome job', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    hashing.hash.mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      name: 'User',
      roles: [{ role: { name: 'USER' } }],
    });
    tokens.signAccessToken.mockResolvedValue('access');
    tokens.signRefreshToken.mockResolvedValue('refresh');

    await expect(service.register('user@example.com', 'password', 'User')).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 1, email: 'user@example.com', name: 'User' },
    });
    expect(hashing.hash).toHaveBeenCalledWith('password');
    const createCall = prisma.user.create.mock.calls[0] as [{ data: { password: string } }];
    expect(createCall[0].data.password).toBe('hashed');
    expect(mailQueue.add).toHaveBeenCalled();
  });

  it('rejects an invalid login password', async () => {
    prisma.user.findUnique.mockResolvedValue({ password: 'hash', roles: [] });
    hashing.compare.mockResolvedValue(false);

    await expect(service.login('user@example.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('delegates refresh rotation and rejects invalid tokens', async () => {
    tokens.rotateRefreshToken.mockRejectedValue(new UnauthorizedException('revoked'));
    await expect(service.refresh('old-token')).rejects.toBeInstanceOf(UnauthorizedException);

    tokens.rotateRefreshToken.mockResolvedValue({ accessToken: 'new-a', refreshToken: 'new-r' });
    await expect(service.refresh('valid-token')).resolves.toEqual({
      accessToken: 'new-a',
      refreshToken: 'new-r',
    });
  });

  it('revokes the refresh token on logout', async () => {
    await service.logout('refresh-token');
    expect(tokens.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
  });
});
