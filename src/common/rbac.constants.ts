import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

export const USER_ROLES_PROVIDER = 'USER_ROLES_PROVIDER';
export type UserRolesProvider = (user: CurrentUserPayload) => string[];

export const USER_PERMISSIONS_PROVIDER = 'USER_PERMISSIONS_PROVIDER';
export type UserPermissionsProvider = (user: CurrentUserPayload) => Promise<string[]> | string[];
