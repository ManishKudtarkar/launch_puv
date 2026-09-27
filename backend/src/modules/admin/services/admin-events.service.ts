import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { Role } from '../../../generated/prisma/enums';
import { EventReviewDto } from '../dto/event-review.dto';

@Injectable()
export class AdminEventsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSuperAdmin(user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can perform this action');
    }
  }

  async getPendingEvents(user: AuthenticatedUser) {
    this.ensureSuperAdmin(user);

    return this.prisma.event.findMany({
      where: {
        status: 'PENDING_APPROVAL',
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getEventForReview(id: string, user: AuthenticatedUser) {
    this.ensureSuperAdmin(user);

    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        agendaItems: true,
        speakers: true,
        sponsors: true,
        registrationForms: true,
        approvals: {
          include: {
            admin: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async approveEvent(
    id: string,
    reviewDto: EventReviewDto,
    user: AuthenticatedUser,
  ) {
    this.ensureSuperAdmin(user);

    const event = await this.findEvent(id);

    if (event.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Only events pending approval can be approved',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
        where: {
          id,
        },
        data: {
          status: 'APPROVED',
        },
      });

      await tx.eventApproval.create({
        data: {
          eventId: id,
          adminId: user.userId,
          action: 'APPROVED',
          remarks: reviewDto.remarks,
        },
      });

      return updatedEvent;
    });
  }

  async requestChanges(
    id: string,
    reviewDto: EventReviewDto,
    user: AuthenticatedUser,
  ) {
    this.ensureSuperAdmin(user);

    const event = await this.findEvent(id);

    if (event.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Only events pending approval can have changes requested',
      );
    }

    const remarks = reviewDto.remarks?.trim();

    if (!remarks) {
      throw new BadRequestException(
        'Remarks are required when requesting changes',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
        where: {
          id,
        },
        data: {
          status: 'CHANGES_REQUESTED',
        },
      });

      await tx.eventApproval.create({
        data: {
          eventId: id,
          adminId: user.userId,
          action: 'CHANGES_REQUESTED',
          remarks,
        },
      });

      return updatedEvent;
    });
  }

  async rejectEvent(
    id: string,
    reviewDto: EventReviewDto,
    user: AuthenticatedUser,
  ) {
    this.ensureSuperAdmin(user);

    const event = await this.findEvent(id);

    if (event.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Only events pending approval can be rejected',
      );
    }

    const remarks = reviewDto.remarks?.trim();

    if (!remarks) {
      throw new BadRequestException(
        'Remarks are required when rejecting an event',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
        where: {
          id,
        },
        data: {
          status: 'REJECTED',
        },
      });

      await tx.eventApproval.create({
        data: {
          eventId: id,
          adminId: user.userId,
          action: 'REJECTED',
          remarks,
        },
      });

      return updatedEvent;
    });
  }

  private async findEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }
}
