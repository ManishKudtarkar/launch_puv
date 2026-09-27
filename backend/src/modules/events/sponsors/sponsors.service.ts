import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service';

import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

import { Role } from '../../../generated/prisma/enums';

import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { ReorderSponsorDto } from './dto/reorder-sponsor.dto';

@Injectable()
export class SponsorsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyEventAccess(eventId: string, user: AuthenticatedUser) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException('Only Event Admins can manage sponsors');
    }

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        createdById: user.userId,
      },
    });

    if (!event) {
      throw new NotFoundException(
        'Event not found or you do not have access to it',
      );
    }

    if (
      event.status !== 'DRAFT' &&
      event.status !== 'CHANGES_REQUESTED' &&
      event.status !== 'APPROVED' &&
      event.status !== 'PUBLISHED'
    ) {
      throw new ForbiddenException(
        'Sponsors cannot be modified in the current event status',
      );
    }

    return event;
  }

  async create(
    eventId: string,
    createSponsorDto: CreateSponsorDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventAccess(eventId, user);

    return this.prisma.eventSponsor.create({
      data: {
        eventId,
        name: createSponsorDto.name,
        logoUrl: createSponsorDto.logoUrl,
        description: createSponsorDto.description,
        websiteUrl: createSponsorDto.websiteUrl,
        sponsorshipLevel: createSponsorDto.sponsorshipLevel,
        displayOrder: createSponsorDto.displayOrder ?? 1,
      },
    });
  }

  async findAll(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.eventSponsor.findMany({
      where: {
        eventId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async findOne(eventId: string, sponsorId: string) {
    const sponsor = await this.prisma.eventSponsor.findFirst({
      where: {
        id: sponsorId,
        eventId,
      },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async update(
    eventId: string,
    sponsorId: string,
    updateSponsorDto: UpdateSponsorDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventAccess(eventId, user);

    await this.findOne(eventId, sponsorId);

    return this.prisma.eventSponsor.update({
      where: {
        id: sponsorId,
      },
      data: {
        name: updateSponsorDto.name,
        logoUrl: updateSponsorDto.logoUrl,
        description: updateSponsorDto.description,
        websiteUrl: updateSponsorDto.websiteUrl,
        sponsorshipLevel: updateSponsorDto.sponsorshipLevel,
        displayOrder: updateSponsorDto.displayOrder,
      },
    });
  }

  async remove(eventId: string, sponsorId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);

    await this.findOne(eventId, sponsorId);

    await this.prisma.eventSponsor.delete({
      where: {
        id: sponsorId,
      },
    });

    return {
      message: 'Sponsor deleted successfully',
    };
  }

  async reorder(
    eventId: string,
    reorderSponsorDto: ReorderSponsorDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventAccess(eventId, user);

    const sponsors = await this.prisma.eventSponsor.findMany({
      where: {
        eventId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(sponsors.map((sponsor) => sponsor.id));

    for (const item of reorderSponsorDto.items) {
      if (!existingIds.has(item.id)) {
        throw new NotFoundException(
          `Sponsor ${item.id} does not belong to this event`,
        );
      }
    }

    await this.prisma.$transaction(
      reorderSponsorDto.items.map((item) =>
        this.prisma.eventSponsor.update({
          where: {
            id: item.id,
          },
          data: {
            displayOrder: item.displayOrder,
          },
        }),
      ),
    );

    return this.prisma.eventSponsor.findMany({
      where: {
        eventId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }
}
