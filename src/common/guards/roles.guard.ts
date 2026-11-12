import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { USER_ROLES_PROVIDER } from '../rbac.constants';
import type { UserRolesProvider } from '../rbac.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_ROLES_PROVIDER) private readonly resolveRoles: UserRolesProvider,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    const userRoles = request.user ? this.resolveRoles(request.user) : [];

    const authorized = requiredRoles.some((role) => userRoles.includes(role));

    if (!authorized) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
