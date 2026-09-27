import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordService } from '../src/modules/auth/password/password.service';

process.loadEnvFile('.env');

const email = 'super-admin@paruluniversity.ac.in';
const password = '12345678';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });
const passwordService = new PasswordService();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        fullName: 'Super Admin',
        passwordHash: await passwordService.hash(password),
        role: 'SUPER_ADMIN',
        userType: 'FACULTY',
        status: 'ACTIVE',
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log('Updated super-admin account:', JSON.stringify(updated, null, 2));
    return;
  }

  const created = await prisma.user.create({
    data: {
      fullName: 'Super Admin',
      email,
      passwordHash: await passwordService.hash(password),
      role: 'SUPER_ADMIN',
      userType: 'FACULTY',
      status: 'ACTIVE',
      mustChangePassword: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('Created super-admin account:', JSON.stringify(created, null, 2));
}

main()
  .catch((error) => {
    console.error('Failed to create super-admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
