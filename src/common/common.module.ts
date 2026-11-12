import { Global, Module } from '@nestjs/common';

import { PermissionsService } from './permissions.service';
import { USER_PERMISSIONS_PROVIDER, USER_ROLES_PROVIDER } from './rbac.constants';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Global()
@Module({
  providers: [
    PermissionsService,
    {
      provide: USER_ROLES_PROVIDER,
      useValue: (user: CurrentUserPayload) => user.roles,
    },
    {
      provide: USER_PERMISSIONS_PROVIDER,
      inject: [PermissionsService],
      useFactory: (permissionsService: PermissionsService) => (user: CurrentUserPayload) =>
        permissionsService.getUserPermissions(user.userId),
    },
  ],
  exports: [PermissionsService, USER_ROLES_PROVIDER, USER_PERMISSIONS_PROVIDER],
})
export class CommonModule {}
