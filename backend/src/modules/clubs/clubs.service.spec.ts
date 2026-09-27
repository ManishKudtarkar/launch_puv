import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EntityStatus, MembershipRole, Role } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('ClubsService', () => {
  let service: ClubsService;

  const prismaMock = {
    club: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    community: {
      findUnique: jest.fn(),
    },
    membership: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const superAdminUser: AuthenticatedUser = {
    userId: 'admin-1',
    email: 'admin@paruluniversity.ac.in',
    role: Role.SUPER_ADMIN,
    userType: 'FACULTY' as any,
    sessionId: 'session-1',
  };

  const studentUser: AuthenticatedUser = {
    userId: 'student-1',
    email: 'student@paruluniversity.ac.in',
    role: Role.PARTICIPANT,
    userType: 'STUDENT' as any,
    sessionId: 'session-2',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClubsService(prismaMock as unknown as PrismaService);
  });

  describe('1. Only Super Admin can create clubs', () => {
    it('allows Super Admin to create a club', async () => {
      prismaMock.club.findUnique.mockResolvedValue(null);
      prismaMock.club.create.mockResolvedValue({
        id: 'club-1',
        name: 'AI Club',
        slug: 'ai-club',
        status: EntityStatus.ACTIVE,
      });

      const result = await service.create({ name: 'AI Club' }, superAdminUser);
      expect(result.id).toBe('club-1');
      expect(prismaMock.club.create).toHaveBeenCalled();
    });

    it('rejects regular students from creating clubs', async () => {
      await expect(
        service.create({ name: 'AI Club' }, studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Only Super Admin can assign/remove Heads and Core Team Members', () => {
    it('allows Super Admin to assign a member', async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        id: 'club-1',
        name: 'AI Club',
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        fullName: 'Student One',
      });
      prismaMock.membership.upsert.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-1',
        clubId: 'club-1',
        role: MembershipRole.HEAD,
      });
      prismaMock.membership.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.club.update.mockResolvedValue({ id: 'club-1', headId: 'student-1' });

      const result = await service.assignMember(
        'club-1',
        { userId: 'student-1', role: MembershipRole.HEAD },
        superAdminUser,
      );

      expect(result.role).toBe(MembershipRole.HEAD);
      expect(prismaMock.membership.upsert).toHaveBeenCalled();
    });

    it('rejects non-Super Admin from assigning a member', async () => {
      await expect(
        service.assignMember(
          'club-1',
          { userId: 'student-1', role: MembershipRole.HEAD },
          studentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows Super Admin to remove a member', async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        id: 'club-1',
        headId: 'student-1',
      });
      prismaMock.club.update.mockResolvedValue({ id: 'club-1', headId: null });
      prismaMock.membership.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.removeMember('club-1', 'student-1', superAdminUser);
      expect(result.message).toBe('Club member removed successfully');
      expect(prismaMock.membership.deleteMany).toHaveBeenCalled();
    });

    it('rejects non-Super Admin from removing a member', async () => {
      await expect(
        service.removeMember('club-1', 'student-1', studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Duplicate follow is idempotent & student cannot follow inactive club', () => {
    it('records follow using upsert and returns accurate count', async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        id: 'club-1',
        status: EntityStatus.ACTIVE,
      });
      prismaMock.follow.upsert.mockResolvedValue({});
      prismaMock.follow.count.mockResolvedValue(15);

      const result = await service.follow('club-1', studentUser);
      expect(result.isFollowing).toBe(true);
      expect(result.followerCount).toBe(15);
    });

    it('rejects follow when club is inactive', async () => {
      prismaMock.club.findUnique.mockResolvedValue({
        id: 'club-1',
        status: EntityStatus.INACTIVE,
      });

      await expect(service.follow('club-1', studentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('4. Public list/detail APIs exclude inactive Clubs', () => {
    it('filters out inactive clubs for public/student queries', async () => {
      prismaMock.club.findMany.mockResolvedValue([
        {
          id: 'club-1',
          name: 'Active Club',
          status: EntityStatus.ACTIVE,
          _count: { followers: 5, events: 1, updates: 0 },
        },
      ]);
      prismaMock.follow.findMany.mockResolvedValue([]);

      const result = await service.findAll(undefined, studentUser);
      expect(result).toHaveLength(1);
      expect(prismaMock.club.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EntityStatus.ACTIVE,
          }),
        }),
      );
    });

    it('throws NotFoundException when public/student accesses inactive club', async () => {
      prismaMock.club.findFirst.mockResolvedValue({
        id: 'club-inactive',
        slug: 'inactive-club',
        status: EntityStatus.INACTIVE,
      });

      await expect(service.findOne('inactive-club', studentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkClubMembership helper (reusable for Phase 2)', () => {
    it('returns true when user has club membership', async () => {
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-1',
        clubId: 'club-1',
        role: MembershipRole.CORE_MEMBER,
      });

      const isMember = await service.checkClubMembership(
        'student-1',
        'club-1',
        MembershipRole.CORE_MEMBER,
      );
      expect(isMember).toBe(true);
    });

    it('returns false when user does not have club membership', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(null);

      const isMember = await service.checkClubMembership('student-2', 'club-1');
      expect(isMember).toBe(false);
    });
  });
});
