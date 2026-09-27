import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  EntityStatus,
  MembershipRole,
  NotificationType,
  Role,
  UpdateStatus,
} from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('UpdatesService', () => {
  let service: UpdatesService;

  const prismaMock = {
    entityUpdate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    community: {
      findUnique: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const notificationsServiceMock = {
    notifyFollowers: jest.fn(),
  };

  const superAdminUser: AuthenticatedUser = {
    userId: 'admin-1',
    email: 'admin@paruluniversity.ac.in',
    role: Role.SUPER_ADMIN,
    userType: 'FACULTY' as any,
    sessionId: 'session-1',
  };

  const assignedStudentHead: AuthenticatedUser = {
    userId: 'student-head',
    email: 'head@paruluniversity.ac.in',
    role: Role.PARTICIPANT,
    userType: 'STUDENT' as any,
    sessionId: 'session-2',
  };

  const unassignedStudent: AuthenticatedUser = {
    userId: 'student-other',
    email: 'other@paruluniversity.ac.in',
    role: Role.PARTICIPANT,
    userType: 'STUDENT' as any,
    sessionId: 'session-3',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UpdatesService(
      prismaMock as unknown as PrismaService,
      notificationsServiceMock as unknown as NotificationsService,
    );
  });

  describe('1. Assigned Head/Core Team can create a draft only for their own Community/Club', () => {
    it('allows assigned head/core member to create draft update', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: EntityStatus.ACTIVE,
      });
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-head',
        communityId: 'comm-1',
        role: MembershipRole.HEAD,
      });
      prismaMock.entityUpdate.create.mockResolvedValue({
        id: 'up-1',
        title: 'Tech Fest 2026',
        content: 'Coming soon',
        status: UpdateStatus.DRAFT,
      });

      const result = await service.create(
        {
          title: 'Tech Fest 2026',
          content: 'Coming soon',
          communityId: 'comm-1',
        },
        assignedStudentHead,
      );

      expect(result.id).toBe('up-1');
      expect(prismaMock.entityUpdate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: UpdateStatus.DRAFT,
          }),
        }),
      );
    });

    it('rejects creating updates for an inactive entity', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: EntityStatus.INACTIVE,
      });

      await expect(
        service.create(
          {
            title: 'Tech Fest 2026',
            content: 'Coming soon',
            communityId: 'comm-1',
          },
          assignedStudentHead,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Unassigned participant cannot create or submit announcements', () => {
    it('rejects unassigned students from creating updates', async () => {
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: EntityStatus.ACTIVE,
      });
      prismaMock.membership.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'Unauthorized Post',
            content: 'Hack',
            communityId: 'comm-1',
          },
          unassignedStudent,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects unassigned students from submitting updates', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        authorId: 'student-head',
        communityId: 'comm-1',
        status: UpdateStatus.DRAFT,
      });

      await expect(service.submit('up-1', unassignedStudent)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('3. Author cannot edit an announcement after it becomes pending or approved', () => {
    it('rejects editing an announcement in PENDING_APPROVAL status', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        authorId: 'student-head',
        communityId: 'comm-1',
        status: UpdateStatus.PENDING_APPROVAL,
      });

      await expect(
        service.update('up-1', { title: 'Edited Title' }, assignedStudentHead),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects editing an announcement in APPROVED status', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        authorId: 'student-head',
        communityId: 'comm-1',
        status: UpdateStatus.APPROVED,
      });

      await expect(
        service.update('up-1', { title: 'Edited Title' }, assignedStudentHead),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows editing an announcement in REJECTED status', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        authorId: 'student-head',
        communityId: 'comm-1',
        status: UpdateStatus.REJECTED,
      });
      prismaMock.community.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: EntityStatus.ACTIVE,
      });
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-head',
        communityId: 'comm-1',
      });
      prismaMock.entityUpdate.update.mockResolvedValue({
        id: 'up-1',
        title: 'Fixed Title',
      });

      const result = await service.update(
        'up-1',
        { title: 'Fixed Title' },
        assignedStudentHead,
      );
      expect(result.title).toBe('Fixed Title');
    });
  });

  describe('4. Only Super Admin can approve/reject', () => {
    it('rejects non-Super Admin from approving updates', async () => {
      await expect(
        service.approve('up-1', {}, assignedStudentHead),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-Super Admin from rejecting updates', async () => {
      await expect(
        service.reject('up-1', { remarks: 'Bad' }, assignedStudentHead),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Reject requires remarks & works for pending announcements', () => {
    it('rejects with BadRequestException if remarks are missing', async () => {
      await expect(
        service.reject('up-1', { remarks: '' }, superAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows Super Admin to reject pending announcement with remarks', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        status: UpdateStatus.PENDING_APPROVAL,
      });
      prismaMock.entityUpdate.update.mockResolvedValue({
        id: 'up-1',
        status: UpdateStatus.REJECTED,
        reviewRemarks: 'Please add venue details',
      });

      const result = await service.reject(
        'up-1',
        { remarks: 'Please add venue details' },
        superAdminUser,
      );

      expect(result.status).toBe(UpdateStatus.REJECTED);
      expect(prismaMock.entityUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: UpdateStatus.REJECTED,
            reviewRemarks: 'Please add venue details',
          },
        }),
      );
    });
  });

  describe('6. Approval creates notifications only for followers of the correct entity atomically', () => {
    it('allows Super Admin to approve update and notifies followers', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        title: 'Approved Post',
        status: UpdateStatus.PENDING_APPROVAL,
        communityId: 'comm-1',
        community: { name: 'Tech Society', slug: 'tech-society' },
        club: null,
      });

      prismaMock.follow.findMany.mockResolvedValue([
        { userId: 'user-fol-1' },
        { userId: 'user-fol-2' },
      ]);

      const mockApproved = {
        id: 'up-1',
        status: UpdateStatus.APPROVED,
      };

      prismaMock.$transaction.mockResolvedValue([mockApproved, {}, {}]);

      const result = await service.approve(
        'up-1',
        { remarks: 'Looks great!' },
        superAdminUser,
      );

      expect(result.status).toBe(UpdateStatus.APPROVED);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('rejects approving non-pending announcements', async () => {
      prismaMock.entityUpdate.findUnique.mockResolvedValue({
        id: 'up-1',
        status: UpdateStatus.APPROVED,
      });

      await expect(
        service.approve('up-1', {}, superAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
