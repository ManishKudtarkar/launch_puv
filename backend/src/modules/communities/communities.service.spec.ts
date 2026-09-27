import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EntityStatus, MembershipRole, Role } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('CommunitiesService', () => {
  let service: CommunitiesService;

  const prismaMock = {
    community: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

  const anotherStudent: AuthenticatedUser = {
    userId: 'student-2',
    email: 'student2@paruluniversity.ac.in',
    role: Role.PARTICIPANT,
    userType: 'STUDENT' as any,
    sessionId: 'session-3',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommunitiesService(prismaMock as unknown as PrismaService);
  });

  describe('1. Only Super Admin can create communities', () => {
    it('allows Super Admin to create a community', async () => {
      prismaMock.community.findUnique.mockResolvedValue(null);
      prismaMock.community.create.mockResolvedValue({
        id: 'comm-1',
        name: 'Robotics Society',
        slug: 'robotics-society',
        status: EntityStatus.ACTIVE,
      });

      const result = await service.create(
        { name: 'Robotics Society' },
        superAdminUser,
      );

      expect(result.id).toBe('comm-1');
      expect(prismaMock.community.create).toHaveBeenCalled();
    });

    it('rejects regular students from creating communities', async () => {
      await expect(
        service.create({ name: 'Robotics Society' }, studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Only Super Admin can assign/remove Heads and Core Team Members', () => {
    it('allows Super Admin to assign a member', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        name: 'Robotics Society',
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        fullName: 'Student One',
      });
      prismaMock.membership.upsert.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-1',
        communityId: 'comm-1',
        role: MembershipRole.CORE_MEMBER,
      });

      const result = await service.assignMember(
        'comm-1',
        { userId: 'student-1', role: MembershipRole.CORE_MEMBER },
        superAdminUser,
      );

      expect(result.role).toBe(MembershipRole.CORE_MEMBER);
      expect(prismaMock.membership.upsert).toHaveBeenCalled();
    });

    it('rejects non-Super Admin from assigning a member', async () => {
      await expect(
        service.assignMember(
          'comm-1',
          { userId: 'student-1', role: MembershipRole.CORE_MEMBER },
          studentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows Super Admin to remove a member', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        headId: 'student-1',
      });
      prismaMock.community.update.mockResolvedValue({ id: 'comm-1', headId: null });
      prismaMock.membership.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.removeMember('comm-1', 'student-1', superAdminUser);
      expect(result.message).toBe('Member removed successfully');
      expect(prismaMock.membership.deleteMany).toHaveBeenCalled();
    });

    it('rejects non-Super Admin from removing a member', async () => {
      await expect(
        service.removeMember('comm-1', 'student-1', studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Duplicate follow is idempotent & accurate count returned', () => {
    it('records follow using upsert and returns follower count', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: EntityStatus.ACTIVE,
      });
      prismaMock.follow.upsert.mockResolvedValue({});
      prismaMock.follow.count.mockResolvedValue(42);

      const result = await service.follow('comm-1', studentUser);
      expect(result.isFollowing).toBe(true);
      expect(result.followerCount).toBe(42);
      expect(prismaMock.follow.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_communityId: {
              userId: studentUser.userId,
              communityId: 'comm-1',
            },
          },
        }),
      );
    });
  });

  describe('4. Student cannot follow an inactive entity', () => {
    it('rejects follow when community is inactive', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: EntityStatus.INACTIVE,
      });

      await expect(service.follow('comm-1', studentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('5. Public list/detail APIs exclude inactive Communities', () => {
    it('filters out inactive communities for public/student list queries', async () => {
      prismaMock.community.findMany.mockResolvedValue([
        {
          id: 'comm-1',
          name: 'Active Community',
          status: EntityStatus.ACTIVE,
          _count: { clubs: 1, followers: 5, events: 2, updates: 0 },
        },
      ]);
      prismaMock.follow.findMany.mockResolvedValue([]);

      const result = await service.findAll(studentUser);
      expect(result).toHaveLength(1);
      expect(prismaMock.community.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EntityStatus.ACTIVE,
          }),
        }),
      );
    });

    it('throws NotFoundException when public/student accesses inactive community detail', async () => {
      prismaMock.community.findFirst.mockResolvedValue({
        id: 'comm-inactive',
        slug: 'inactive-comm',
        status: EntityStatus.INACTIVE,
      });

      await expect(service.findOne('inactive-comm', studentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows Super Admin to view inactive community detail', async () => {
      prismaMock.community.findFirst.mockResolvedValue({
        id: 'comm-inactive',
        slug: 'inactive-comm',
        status: EntityStatus.INACTIVE,
        _count: { followers: 0, clubs: 0, events: 0 },
      });

      const result = await service.findOne('inactive-comm', superAdminUser);
      expect(result.id).toBe('comm-inactive');
    });
  });

  describe('checkMembership helper (reusable for Phase 2)', () => {
    it('returns true when user has membership', async () => {
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-1',
        communityId: 'comm-1',
        role: MembershipRole.HEAD,
      });

      const isMember = await service.checkMembership(
        'student-1',
        'comm-1',
        MembershipRole.HEAD,
      );
      expect(isMember).toBe(true);
    });

    it('returns false when user does not have membership', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(null);

      const isMember = await service.checkMembership('student-2', 'comm-1');
      expect(isMember).toBe(false);
    });
  });
});
