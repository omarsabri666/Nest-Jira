import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { USER_PERMISSIONS_PROVIDER } from '../rbac.constants';
import type { UserPermissionsProvider } from '../rbac.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_PERMISSIONS_PROVIDER)
    private readonly resolvePermissions: UserPermissionsProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();

    if (!request.user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const userPermissions = await this.resolvePermissions(request.user);

    const authorized = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!authorized) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
