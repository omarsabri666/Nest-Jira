import { Prisma } from '@prisma/client';

export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
