import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordService } from '../src/modules/auth/password/password.service';

process.loadEnvFile('.env');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const superAdminEmail = getRequiredEnvironmentVariable(
  'SUPER_ADMIN_EMAIL',
  true,
).toLowerCase();
const superAdminPassword = getRequiredEnvironmentVariable(
  'SUPER_ADMIN_PASSWORD',
);
const superAdminName = process.env.SUPER_ADMIN_FULL_NAME?.trim() || 'University Director';

function getRequiredEnvironmentVariable(name: string, trim = false): string {
  const value = process.env[name];

  if (!value || (trim && !value.trim())) {
    throw new Error(`${name} is not defined`);
  }

  return trim ? value.trim() : value;
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

// Keep the bootstrap hash compatible with the authentication service.
const passwordService = new PasswordService();

async function main() {
  console.log('Starting Super Admin bootstrap...');

  const existingSuperAdmins = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (existingSuperAdmins.length > 1) {
    throw new Error(
      `Database contains ${existingSuperAdmins.length} SUPER_ADMIN accounts. Manual correction is required.`,
    );
  }

  if (existingSuperAdmins.length === 1) {
    console.log(
      `SUPER_ADMIN already exists: ${existingSuperAdmins[0].email}`,
    );
    console.log('No new Super Admin was created.');
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: superAdminEmail,
    },
  });

  if (existingUser) {
    throw new Error(
      `A user with email ${superAdminEmail} already exists with role ${existingUser.role}.`,
    );
  }

  const passwordHash = await passwordService.hash(superAdminPassword);

  const superAdmin = await prisma.user.create({
    data: {
      fullName: superAdminName,
      email: superAdminEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
      userType: 'FACULTY',
      status: 'ACTIVE',
      mustChangePassword: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      userType: true,
      status: true,
      mustChangePassword: true,
    },
  });

  console.log('Super Admin created successfully.');
  console.log(`Email: ${superAdmin.email}`);
  console.log(`Role: ${superAdmin.role}`);
  console.log(`Must change password: ${superAdmin.mustChangePassword}`);
}

main()
  .catch((error) => {
    console.error('Super Admin bootstrap failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
