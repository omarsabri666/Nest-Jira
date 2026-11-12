import { PrismaPg } from '@prisma/adapter-pg';
import { Permission, PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('Start seeding...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: {
      name: RoleName.USER,
    },
  });

  console.log('Created roles:', { adminRole, userRole });

  // Create permissions
  const permissionNames = [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'project:create',
  ];

  const permissions: Permission[] = [];
  for (const name of permissionNames) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    permissions.push(permission);
  }

  console.log('Created permissions:', permissions.map((p) => p.name).join(', '));

  // Grant all permissions to ADMIN role
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Granted permissions to ADMIN role');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'omar@example' },
    update: {
      password: adminPassword,
      name: 'Admin User',
      isActive: true,
    },
    create: {
      email: 'omar@example',
      password: adminPassword,
      name: 'Admin User',
      isActive: true,
    },
  });

  console.log('Created admin user:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
  });

  // Assign ADMIN role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('Assigned ADMIN role to admin user');

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
