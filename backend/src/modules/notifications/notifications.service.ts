import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationType } from '../../generated/prisma/enums';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'All notifications marked as read' };
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type ?? NotificationType.INFO,
        link: data.link,
      },
    });
  }

  async notifyFollowers(
    target: { communityId?: string; clubId?: string },
    title: string,
    message: string,
    link?: string,
    type: NotificationType = NotificationType.INFO,
  ) {
    let followers: { userId: string }[] = [];

    if (target.communityId) {
      followers = await this.prisma.follow.findMany({
        where: { communityId: target.communityId },
        select: { userId: true },
      });
    } else if (target.clubId) {
      followers = await this.prisma.follow.findMany({
        where: { clubId: target.clubId },
        select: { userId: true },
      });
    }

    if (followers.length === 0) return [];

    const uniqueUserIds = Array.from(new Set(followers.map((f) => f.userId)));

    return this.prisma.$transaction(
      uniqueUserIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            link,
          },
        }),
      ),
    );
  }
}
