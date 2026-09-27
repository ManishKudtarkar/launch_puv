import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('EventsService (Phase 2 Scoped Community/Club Events)', () => {
  let service: EventsService;

  const prismaMock = {
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const superAdminUser: AuthenticatedUser = {
    userId: 'admin-1',
    email: 'admin@paruluniversity.ac.in',
    role: Role.SUPER_ADMIN,
    userType: 'FACULTY' as any,
    sessionId: 'session-1',
  };

  const eventAdminUser: AuthenticatedUser = {
    userId: 'event-admin-1',
    email: 'eventadmin@paruluniversity.ac.in',
    role: Role.EVENT_ADMIN,
    userType: 'FACULTY' as any,
    sessionId: 'session-2',
  };

  const assignedStudentHead: AuthenticatedUser = {
    userId: 'student-head',
    email: 'head@paruluniversity.ac.in',
    role: Role.PARTICIPANT,
    userType: 'STUDENT' as any,
    sessionId: 'session-3',
  };

  const unassignedStudent: AuthenticatedUser = {
    userId: 'student-other',
    email: 'other@paruluniversity.ac.in',
    role: Role.PARTICIPANT,
    userType: 'STUDENT' as any,
    sessionId: 'session-4',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prismaMock as unknown as PrismaService);
  });

  describe('Entity link validation', () => {
    it('12. Rejects event linked to both Community and Club', async () => {
      await expect(
        service.create(
          {
            title: 'Conflict Event',
            eventDate: new Date().toISOString(),
            communityId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            clubId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
          },
          assignedStudentHead,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Participant creation rules', () => {
    it('10. Rejects participant creating unscoped event', async () => {
      await expect(
        service.create(
          {
            title: 'Unscoped Event',
            eventDate: new Date().toISOString(),
          },
          unassignedStudent,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('10. Rejects participant creating event for entity they do not belong to', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'Unauthorized Event',
            eventDate: new Date().toISOString(),
            communityId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          },
          unassignedStudent,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('9. Allows participant Head/Core Team to create event for assigned entity', async () => {
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-head',
        communityId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      });
      prismaMock.event.findUnique.mockResolvedValue(null);
      prismaMock.event.create.mockResolvedValue({
        id: 'ev-1',
        title: 'Robotics Workshop',
        communityId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        status: 'DRAFT',
      });

      const result = await service.create(
        {
          title: 'Robotics Workshop',
          eventDate: new Date().toISOString(),
          communityId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        },
        assignedStudentHead,
      );

      expect(result.id).toBe('ev-1');
      expect(prismaMock.event.create).toHaveBeenCalled();
    });
  });

  describe('Event Admin behavior preservation', () => {
    it('11. Existing Event Admin can create normal event without entity link', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);
      prismaMock.event.create.mockResolvedValue({
        id: 'ev-admin-1',
        title: 'Global Tech Conclave',
        status: 'DRAFT',
      });

      const result = await service.create(
        {
          title: 'Global Tech Conclave',
          eventDate: new Date().toISOString(),
        },
        eventAdminUser,
      );

      expect(result.id).toBe('ev-admin-1');
      expect(prismaMock.event.create).toHaveBeenCalled();
    });
  });

  describe('Event management scoped permissions', () => {
    it('allows participant to edit draft event for their assigned entity', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        createdById: 'student-head',
        communityId: 'comm-1',
        status: 'DRAFT',
      });
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'student-head',
        communityId: 'comm-1',
      });
      prismaMock.event.update.mockResolvedValue({
        id: 'ev-1',
        title: 'Updated Workshop',
      });

      const result = await service.update(
        'ev-1',
        { title: 'Updated Workshop' },
        assignedStudentHead,
      );

      expect(result.title).toBe('Updated Workshop');
    });

    it('rejects unauthorized student from editing an event for another entity', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        createdById: 'student-head',
        communityId: 'comm-1',
        status: 'DRAFT',
      });
      prismaMock.membership.findFirst.mockResolvedValue(null);

      await expect(
        service.update('ev-1', { title: 'Hack' }, unassignedStudent),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
