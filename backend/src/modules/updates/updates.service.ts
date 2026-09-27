import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  EntityStatus,
  NotificationType,
  Role,
  UpdateStatus,
} from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUpdateDto } from './dto/create-update.dto';
import { UpdateUpdateDto } from './dto/update-update.dto';
import { ReviewUpdateDto } from './dto/review-update.dto';
import { RejectUpdateDto } from './dto/reject-update.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async verifyScopedAccess(
    target: { communityId?: string; clubId?: string },
    user: AuthenticatedUser,
  ) {
    if (user.role === Role.SUPER_ADMIN) return;

    if (!target.communityId && !target.clubId) {
      throw new BadRequestException(
        'An update must belong to exactly one Community or Club',
      );
    }

    if (target.communityId && target.clubId) {
      throw new BadRequestException(
        'An update cannot belong to both a Community and a Club simultaneously',
      );
    }

    // Verify entity exists and is ACTIVE
    if (target.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: target.communityId },
      });
      if (!community) {
        throw new NotFoundException('Community not found');
      }
      if (community.status !== EntityStatus.ACTIVE) {
        throw new ForbiddenException(
          'Cannot create or submit updates for an inactive Community',
        );
      }
    } else if (target.clubId) {
      const club = await this.prisma.club.findUnique({
        where: { id: target.clubId },
      });
      if (!club) {
        throw new NotFoundException('Club not found');
      }
      if (club.status !== EntityStatus.ACTIVE) {
        throw new ForbiddenException(
          'Cannot create or submit updates for an inactive Club',
        );
      }
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.userId,
        OR: [
          target.communityId ? { communityId: target.communityId } : {},
          target.clubId ? { clubId: target.clubId } : {},
        ],
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not authorized to create or edit updates for this entity',
      );
    }
  }

  async getMyAssignments(user: AuthenticatedUser) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.userId },
      include: {
        community: {
          include: {
            _count: { select: { followers: true, clubs: true, events: true } },
          },
        },
        club: {
          include: {
            community: { select: { id: true, name: true, slug: true } },
            _count: { select: { followers: true, events: true } },
          },
        },
      },
    });

    const communityIds = memberships
      .map((m) => m.communityId)
      .filter((id): id is string => Boolean(id));

    const clubIds = memberships
      .map((m) => m.clubId)
      .filter((id): id is string => Boolean(id));

    // Return only the current user's relevant announcements
    const updates = await this.prisma.entityUpdate.findMany({
      where: {
        authorId: user.userId,
        OR: [
          { communityId: { in: communityIds } },
          { clubId: { in: clubIds } },
        ],
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        club: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const communities = memberships
      .filter((m) => Boolean(m.community))
      .map((m) => {
        const comm = m.community!;
        return {
          ...comm,
          membershipRole: m.role,
          followerCount: comm._count?.followers ?? 0,
          clubCount: comm._count?.clubs ?? 0,
          eventCount: comm._count?.events ?? 0,
          updates: updates.filter((u) => u.communityId === comm.id),
        };
      });

    const clubs = memberships
      .filter((m) => Boolean(m.club))
      .map((m) => {
        const cl = m.club!;
        return {
          ...cl,
          membershipRole: m.role,
          followerCount: cl._count?.followers ?? 0,
          eventCount: cl._count?.events ?? 0,
          updates: updates.filter((u) => u.clubId === cl.id),
        };
      });

    return {
      communities,
      clubs,
      memberships,
      updates,
    };
  }

  async getPendingUpdates(user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only Super Admins can view pending updates',
      );
    }

    return this.prisma.entityUpdate.findMany({
      where: { status: UpdateStatus.PENDING_APPROVAL },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        club: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUpdateDto, user: AuthenticatedUser) {
    await this.verifyScopedAccess(dto, user);

    const status = dto.submitForApproval
      ? UpdateStatus.PENDING_APPROVAL
      : UpdateStatus.DRAFT;

    return this.prisma.entityUpdate.create({
      data: {
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
        communityId: dto.communityId,
        clubId: dto.clubId,
        authorId: user.userId,
        status,
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        club: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateUpdateDto, user: AuthenticatedUser) {
    const updateRecord = await this.prisma.entityUpdate.findUnique({
      where: { id },
    });

    if (!updateRecord) {
      throw new NotFoundException('Update not found');
    }

    // Only the original authorized author or Super Admin can edit
    if (user.role !== Role.SUPER_ADMIN && updateRecord.authorId !== user.userId) {
      throw new ForbiddenException('Only the original author can edit this announcement');
    }

    // Only DRAFT or REJECTED announcements may be edited
    if (
      updateRecord.status !== UpdateStatus.DRAFT &&
      updateRecord.status !== UpdateStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only draft or rejected announcements can be edited',
      );
    }

    await this.verifyScopedAccess(
      {
        communityId: updateRecord.communityId ?? undefined,
        clubId: updateRecord.clubId ?? undefined,
      },
      user,
    );

    return this.prisma.entityUpdate.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async submit(id: string, user: AuthenticatedUser) {
    const updateRecord = await this.prisma.entityUpdate.findUnique({
      where: { id },
    });

    if (!updateRecord) {
      throw new NotFoundException('Update not found');
    }

    // Only original author can submit
    if (user.role !== Role.SUPER_ADMIN && updateRecord.authorId !== user.userId) {
      throw new ForbiddenException('Only the original author can submit this announcement');
    }

    // Only DRAFT or REJECTED announcements can be submitted
    if (
      updateRecord.status !== UpdateStatus.DRAFT &&
      updateRecord.status !== UpdateStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only draft or rejected announcements can be submitted for approval',
      );
    }

    await this.verifyScopedAccess(
      {
        communityId: updateRecord.communityId ?? undefined,
        clubId: updateRecord.clubId ?? undefined,
      },
      user,
    );

    return this.prisma.entityUpdate.update({
      where: { id },
      data: {
        status: UpdateStatus.PENDING_APPROVAL,
      },
    });
  }

  async approve(id: string, dto: ReviewUpdateDto, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can approve updates');
    }

    const updateRecord = await this.prisma.entityUpdate.findUnique({
      where: { id },
      include: {
        community: true,
        club: true,
      },
    });

    if (!updateRecord) {
      throw new NotFoundException('Update not found');
    }

    if (updateRecord.status !== UpdateStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only announcements pending approval can be approved',
      );
    }

    // Fetch followers to notify within the approval flow
    let followers: { userId: string }[] = [];
    if (updateRecord.communityId) {
      followers = await this.prisma.follow.findMany({
        where: { communityId: updateRecord.communityId },
        select: { userId: true },
      });
    } else if (updateRecord.clubId) {
      followers = await this.prisma.follow.findMany({
        where: { clubId: updateRecord.clubId },
        select: { userId: true },
      });
    }

    const uniqueFollowerIds = Array.from(new Set(followers.map((f) => f.userId)));

    const entityName =
      updateRecord.community?.name || updateRecord.club?.name || 'Community';
    const link = updateRecord.community
      ? `/student/communities/${updateRecord.community.slug}`
      : updateRecord.club
      ? `/student/clubs/${updateRecord.club.slug}`
      : undefined;

    // Use transaction for atomic approval + notification dispatch
    const [approvedUpdate] = await this.prisma.$transaction([
      this.prisma.entityUpdate.update({
        where: { id },
        data: {
          status: UpdateStatus.APPROVED,
          reviewRemarks: dto.remarks,
          publishedAt: new Date(),
        },
      }),
      ...uniqueFollowerIds.map((followerUserId) =>
        this.prisma.notification.create({
          data: {
            userId: followerUserId,
            title: `New update from ${entityName}`,
            message: updateRecord.title,
            type: NotificationType.SUCCESS,
            link,
          },
        }),
      ),
    ]);

    return approvedUpdate;
  }

  async reject(id: string, dto: RejectUpdateDto, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can reject updates');
    }

    if (!dto.remarks || dto.remarks.trim() === '') {
      throw new BadRequestException('Review remarks are required when rejecting an update');
    }

    const updateRecord = await this.prisma.entityUpdate.findUnique({
      where: { id },
    });

    if (!updateRecord) {
      throw new NotFoundException('Update not found');
    }

    if (updateRecord.status !== UpdateStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only announcements pending approval can be rejected',
      );
    }

    return this.prisma.entityUpdate.update({
      where: { id },
      data: {
        status: UpdateStatus.REJECTED,
        reviewRemarks: dto.remarks,
      },
    });
  }

  async delete(id: string, user: AuthenticatedUser) {
    const updateRecord = await this.prisma.entityUpdate.findUnique({
      where: { id },
    });

    if (!updateRecord) {
      throw new NotFoundException('Update not found');
    }

    if (user.role !== Role.SUPER_ADMIN && updateRecord.authorId !== user.userId) {
      throw new ForbiddenException('Only the original author can delete this update');
    }

    await this.verifyScopedAccess(
      {
        communityId: updateRecord.communityId ?? undefined,
        clubId: updateRecord.clubId ?? undefined,
      },
      user,
    );

    await this.prisma.entityUpdate.delete({
      where: { id },
    });

    return { message: 'Update deleted successfully' };
  }
}
