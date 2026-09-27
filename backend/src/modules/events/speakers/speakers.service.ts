import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service';

import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

import { Role } from '../../../generated/prisma/enums';

import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { ReorderSpeakerDto } from './dto/reorder-speaker.dto';

@Injectable()
export class SpeakersService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyEventAccess(eventId: string, user: AuthenticatedUser) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException('Only Event Admins can manage speakers');
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
        'Speakers cannot be modified in the current event status',
      );
    }

    return event;
  }

  async create(
    eventId: string,
    createSpeakerDto: CreateSpeakerDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventAccess(eventId, user);

    return this.prisma.eventSpeaker.create({
      data: {
        eventId,
        name: createSpeakerDto.name,
        designation: createSpeakerDto.designation,
        organization: createSpeakerDto.organization,
        bio: createSpeakerDto.bio,
        photoUrl: createSpeakerDto.photoUrl,
        linkedinUrl: createSpeakerDto.linkedinUrl,
        displayOrder: createSpeakerDto.displayOrder ?? 1,
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

    return this.prisma.eventSpeaker.findMany({
      where: {
        eventId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async findOne(eventId: string, speakerId: string) {
    const speaker = await this.prisma.eventSpeaker.findFirst({
      where: {
        id: speakerId,
        eventId,
      },
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    return speaker;
  }

  async update(
    eventId: string,
    speakerId: string,
    updateSpeakerDto: UpdateSpeakerDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventAccess(eventId, user);

    await this.findOne(eventId, speakerId);

    return this.prisma.eventSpeaker.update({
      where: {
        id: speakerId,
      },
      data: {
        name: updateSpeakerDto.name,
        designation: updateSpeakerDto.designation,
        organization: updateSpeakerDto.organization,
        bio: updateSpeakerDto.bio,
        photoUrl: updateSpeakerDto.photoUrl,
        linkedinUrl: updateSpeakerDto.linkedinUrl,
        displayOrder: updateSpeakerDto.displayOrder,
      },
    });
  }

  async remove(eventId: string, speakerId: string, user: AuthenticatedUser) {
    await this.verifyEventAccess(eventId, user);

    await this.findOne(eventId, speakerId);

    await this.prisma.eventSpeaker.delete({
      where: {
        id: speakerId,
      },
    });

    return {
      message: 'Speaker deleted successfully',
    };
  }

  async reorder(
    eventId: string,
    reorderSpeakerDto: ReorderSpeakerDto,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventAccess(eventId, user);

    const speakers = await this.prisma.eventSpeaker.findMany({
      where: {
        eventId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(speakers.map((speaker) => speaker.id));

    for (const item of reorderSpeakerDto.items) {
      if (!existingIds.has(item.id)) {
        throw new NotFoundException(
          `Speaker ${item.id} does not belong to this event`,
        );
      }
    }

    await this.prisma.$transaction(
      reorderSpeakerDto.items.map((item) =>
        this.prisma.eventSpeaker.update({
          where: {
            id: item.id,
          },
          data: {
            displayOrder: item.displayOrder,
          },
        }),
      ),
    );

    return this.prisma.eventSpeaker.findMany({
      where: {
        eventId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }
}
