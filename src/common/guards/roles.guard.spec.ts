import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const resolveRoles = jest.fn();
  const request = { user: { userId: 1, email: 'u@example.com', roles: ['USER'] } };
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const guard = new RolesGuard(reflector, resolveRoles);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes without role metadata', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a matching role and rejects a wrong role', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['USER']);
    resolveRoles.mockReturnValue(['USER']);
    expect(guard.canActivate(context)).toBe(true);

    resolveRoles.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
