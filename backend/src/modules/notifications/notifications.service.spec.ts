import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationType } from '../../generated/prisma/enums';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prismaMock = {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prismaMock as unknown as PrismaService);
  });

  describe('getMyNotifications', () => {
    it('only retrieves notifications belonging to the requested userId', async () => {
      const userNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Welcome',
          message: 'Welcome to PUVerse',
          read: false,
        },
      ];
      prismaMock.notification.findMany.mockResolvedValue(userNotifications);

      const result = await service.getMyNotifications('user-1');
      expect(result).toEqual(userNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read if it belongs to the user', async () => {
      prismaMock.notification.findFirst.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        read: false,
      });
      prismaMock.notification.update.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        read: true,
      });

      const result = await service.markAsRead('user-1', 'notif-1');
      expect(result.read).toBe(true);
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
    });

    it('throws NotFoundException if user tries to mark another user notification as read', async () => {
      // findFirst returns null because userId does not match
      prismaMock.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead('user-2', 'notif-belonging-to-user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('only updates notifications for the specified user', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user-1');
      expect(result.message).toBe('All notifications marked as read');
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('createNotification (Phase 2 helper)', () => {
    it('persists a notification safely', async () => {
      const notifData = {
        userId: 'user-1',
        title: 'New Event',
        message: 'Tech Fest 2026',
        type: NotificationType.INFO,
      };
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-new',
        ...notifData,
        read: false,
      });

      const result = await service.createNotification(notifData);
      expect(result.id).toBe('notif-new');
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });
  });
});
