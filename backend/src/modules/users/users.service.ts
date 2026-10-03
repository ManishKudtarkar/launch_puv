import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';
import { PasswordService } from '../auth/password/password.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpgradeAccountDto } from './dto/upgrade-account.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (createUserDto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super Admin creation is only supported through seed configuration',
      );
    }

    const passwordHash = await this.passwordService.hash(
      createUserDto.password,
    );

    const user = await this.prisma.user.create({
      data: {
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
        userType: createUserDto.userType,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User created successfully',
      user,
    };
  }

  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super Admin role cannot be changed using this endpoint',
      );
    }

    if (role === Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super Admin role cannot be assigned using this endpoint',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async upgradeAccount(userId: string, dto: UpgradeAccountDto) {
    const PARUL_DOMAIN = '@paruluniversity.ac.in';

    if (!dto.officialEmail.toLowerCase().endsWith(PARUL_DOMAIN)) {
      throw new BadRequestException(
        `officialEmail must be a Parul University address ending in ${PARUL_DOMAIN}.`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, ugNumber: true, isVerifiedDomain: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.isVerifiedDomain) {
      throw new BadRequestException(
        'This account already has a verified university domain.',
      );
    }

    // Guard: official email must not already belong to another account.
    const emailClash = await this.prisma.user.findUnique({
      where: { email: dto.officialEmail },
    });
    if (emailClash && emailClash.id !== userId) {
      throw new ConflictException(
        'This official email address is already linked to another account.',
      );
    }

    // Guard: enrollment number must not already belong to another account.
    const enrollClash = await this.prisma.user.findUnique({
      where: { enrollmentNumber: dto.enrollmentNumber },
    });
    if (enrollClash && enrollClash.id !== userId) {
      throw new ConflictException(
        'This Enrollment Number is already linked to another account.',
      );
    }

    // All existing relations (StudentRegistration, Membership, Follow …)
    // reference user.id, which doesn't change — history is fully preserved.
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.officialEmail,
        enrollmentNumber: dto.enrollmentNumber,
        isVerifiedDomain: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userType: true,
        status: true,
        ugNumber: true,
        enrollmentNumber: true,
        department: true,
        isVerifiedDomain: true,
        updatedAt: true,
      },
    });

    return {
      message:
        'Account upgraded successfully. Your event history and memberships are fully preserved.',
      user: updated,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin users cannot be deleted');
    }

    await this.prisma.$transaction([
      this.prisma.eventApproval.deleteMany({
        where: {
          adminId: userId,
        },
      }),
      this.prisma.event.deleteMany({
        where: {
          createdById: userId,
        },
      }),
      this.prisma.user.delete({
        where: {
          id: userId,
        },
      }),
    ]);

    return {
      message: 'User permanently deleted',
      userId: user.id,
    };
  }
}