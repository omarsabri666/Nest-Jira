import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector);
  });

  it('allows public routes without authenticating', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('delegates protected routes to Passport, which rejects missing or invalid tokens', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const passport = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(false);
    expect(guard.canActivate(context)).toBe(false);
    expect(passport).toHaveBeenCalledWith(context);
  });
});
