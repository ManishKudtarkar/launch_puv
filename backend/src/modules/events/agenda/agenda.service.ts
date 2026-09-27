import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { Role } from '../../../generated/prisma/enums';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { ReorderAgendaDto } from './dto/reorder-agenda.dto';

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    eventId: string,
    createAgendaDto: CreateAgendaDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException('Only Event Admins can manage agenda');
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
        'Agenda cannot be modified in the current event status',
      );
    }

    return this.prisma.eventAgenda.create({
      data: {
        eventId,
        title: createAgendaDto.title,
        description: createAgendaDto.description,
        startTime: new Date(createAgendaDto.startTime),
        endTime: createAgendaDto.endTime
          ? new Date(createAgendaDto.endTime)
          : undefined,
        displayOrder: createAgendaDto.displayOrder,
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

    return this.prisma.eventAgenda.findMany({
      where: {
        eventId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async update(
    eventId: string,
    agendaId: string,
    updateAgendaDto: UpdateAgendaDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException('Only Event Admins can manage agenda');
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

    if (event.status !== 'DRAFT') {
      throw new ForbiddenException(
        'Agenda can only be modified for draft events',
      );
    }

    const agenda = await this.prisma.eventAgenda.findFirst({
      where: {
        id: agendaId,
        eventId,
      },
    });

    if (!agenda) {
      throw new NotFoundException('Agenda item not found');
    }

    return this.prisma.eventAgenda.update({
      where: {
        id: agendaId,
      },
      data: {
        title: updateAgendaDto.title,
        description: updateAgendaDto.description,
        startTime: updateAgendaDto.startTime
          ? new Date(updateAgendaDto.startTime)
          : undefined,
        endTime: updateAgendaDto.endTime
          ? new Date(updateAgendaDto.endTime)
          : undefined,
        displayOrder: updateAgendaDto.displayOrder,
      },
    });
  }
  async remove(eventId: string, agendaId: string, user: AuthenticatedUser) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException('Only Event Admins can manage agenda');
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

    if (event.status !== 'DRAFT') {
      throw new ForbiddenException(
        'Agenda can only be modified for draft events',
      );
    }

    const agenda = await this.prisma.eventAgenda.findFirst({
      where: {
        id: agendaId,
        eventId,
      },
    });

    if (!agenda) {
      throw new NotFoundException('Agenda item not found');
    }

    await this.prisma.eventAgenda.delete({
      where: {
        id: agendaId,
      },
    });

    return {
      message: 'Agenda item deleted successfully',
    };
  }

  async reorder(
    eventId: string,
    reorderAgendaDto: ReorderAgendaDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException('Only Event Admins can manage agenda');
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

    if (event.status !== 'DRAFT') {
      throw new ForbiddenException(
        'Agenda can only be modified for draft events',
      );
    }

    const agendaItems = await this.prisma.eventAgenda.findMany({
      where: {
        eventId,
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(agendaItems.map((item) => item.id));

    for (const item of reorderAgendaDto.items) {
      if (!existingIds.has(item.id)) {
        throw new NotFoundException(
          `Agenda item ${item.id} does not belong to this event`,
        );
      }
    }

    await this.prisma.$transaction(
      reorderAgendaDto.items.map((item) =>
        this.prisma.eventAgenda.update({
          where: {
            id: item.id,
          },
          data: {
            displayOrder: item.displayOrder,
          },
        }),
      ),
    );

    return this.prisma.eventAgenda.findMany({
      where: {
        eventId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }
}
