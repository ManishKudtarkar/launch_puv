import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDayLabelDto } from './dto/event-day-label.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Role } from '../../generated/prisma/enums';
import { UpdateEventDto } from './dto/update-event.dto';
import { generateSlug } from '../../common/utils/slug.util';

// --------------- native date helpers (no extra dependency) ---------------

/** Strips the time portion and returns midnight UTC of the given date. */
const startOfDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** Adds `n` calendar days to a Date, returning a new Date. */
const addDays = (d: Date, n: number): Date => {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
};

/**
 * Returns the number of whole calendar days between two dates
 * (ignoring time – mirrors date-fns `differenceInCalendarDays`).
 */
const differenceInCalendarDays = (laterDate: Date, earlierDate: Date): number =>
  Math.round(
    (startOfDay(laterDate).getTime() - startOfDay(earlierDate).getTime()) /
      86_400_000,
  );

// -------------------------------------------------------------------------

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // HELPERS
  // =========================================================

  /**
   * Builds the list of EventDay create-payloads for a date range.
   * @param startDate  Inclusive start (JS Date or ISO string)
   * @param endDate    Inclusive end   (JS Date or ISO string)
   * @param dayLabels  Optional per-day custom titles from the DTO
   */
  private buildEventDays(
    startDate: Date,
    endDate: Date,
    dayLabels?: EventDayLabelDto[],
  ): { dayNumber: number; date: Date; title?: string; isAttendanceActive: boolean }[] {
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

    if (totalDays < 1) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const labelMap = new Map<number, EventDayLabelDto>();
    if (dayLabels) {
      for (const label of dayLabels) {
        labelMap.set(label.dayNumber, label);
      }
    }

    return Array.from({ length: totalDays }, (_, i) => {
      const dayNumber = i + 1;
      const label = labelMap.get(dayNumber);
      const date = label?.date
        ? startOfDay(new Date(label.date))
        : startOfDay(addDays(startDate, i));

      return {
        dayNumber,
        date,
        title: label?.title ?? `Day ${dayNumber}`,
        isAttendanceActive: true,
      };
    });
  }

  private async canManageEvent(
    event: { id: string; createdById: string; communityId?: string | null; clubId?: string | null },
    user: AuthenticatedUser,
  ): Promise<boolean> {
    if (user.role === Role.SUPER_ADMIN) return true;
    if (user.role === Role.EVENT_ADMIN && event.createdById === user.userId) return true;
    if (event.communityId || event.clubId) {
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.userId,
          OR: [
            event.communityId ? { communityId: event.communityId } : {},
            event.clubId ? { clubId: event.clubId } : {},
          ],
        },
      });
      if (membership) return true;
    }
    return false;
  }

  // =========================================================
  // CREATE EVENT
  // =========================================================

  async create(createEventDto: CreateEventDto, user: AuthenticatedUser) {
    if (createEventDto.communityId && createEventDto.clubId) {
      throw new BadRequestException(
        'An event cannot be linked to both a Community and a Club',
      );
    }

    if (user.role === Role.PARTICIPANT) {
      if (!createEventDto.communityId && !createEventDto.clubId) {
        throw new ForbiddenException(
          'Students must assign events to their Community or Club',
        );
      }

      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.userId,
          OR: [
            createEventDto.communityId ? { communityId: createEventDto.communityId } : {},
            createEventDto.clubId ? { clubId: createEventDto.clubId } : {},
          ],
        },
      });

      if (!membership) {
        throw new ForbiddenException(
          'You are not authorized to create events for this Community or Club',
        );
      }
    } else if (createEventDto.communityId || createEventDto.clubId) {
      if (user.role !== Role.SUPER_ADMIN) {
        const membership = await this.prisma.membership.findFirst({
          where: {
            userId: user.userId,
            OR: [
              createEventDto.communityId ? { communityId: createEventDto.communityId } : {},
              createEventDto.clubId ? { clubId: createEventDto.clubId } : {},
            ],
          },
        });
        if (!membership) {
          throw new ForbiddenException(
            'You are not authorized to create events for this Community or Club',
          );
        }
      }
    }

    let slug = generateSlug(createEventDto.title);

    const existingEvent = await this.prisma.event.findUnique({
      where: {
        slug,
      },
    });

    if (existingEvent) {
      slug = `${slug}-${Date.now()}`;
    }

    // ── Multi-day computation ──────────────────────────────
    const startDate = startOfDay(new Date(createEventDto.startDate));
    const endDate   = startOfDay(new Date(createEventDto.endDate));
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

    if (totalDays < 1) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const isMultiDay = totalDays > 1;
    const eventDays  = this.buildEventDays(startDate, endDate, createEventDto.dayLabels);

    // ── Persist inside a single transaction ───────────────
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: createEventDto.title,
          slug,
          description: createEventDto.description,
          bannerUrl:   createEventDto.bannerUrl,

          eventDate: new Date(createEventDto.eventDate),
          startDate,
          endDate,
          totalDays,
          isMultiDay,

          startTime: createEventDto.startTime
            ? new Date(createEventDto.startTime)
            : undefined,

          endTime: createEventDto.endTime
            ? new Date(createEventDto.endTime)
            : undefined,

          venue: createEventDto.venue,

          createdById: user.userId,
          communityId: createEventDto.communityId,
          clubId:      createEventDto.clubId,
        },
      });

      // Create one EventDay row per calendar day
      await tx.eventDay.createMany({
        data: eventDays.map((d) => ({
          eventId:            event.id,
          dayNumber:          d.dayNumber,
          date:               d.date,
          title:              d.title,
          isAttendanceActive: d.isAttendanceActive,
        })),
      });

      // Return the event together with its days
      return tx.event.findUnique({
        where: { id: event.id },
        include: {
          days: { orderBy: { dayNumber: 'asc' } },
        },
      });
    });
  }

  // =========================================================
  // GET PUBLISHED EVENTS
  // =========================================================

  async getPublishedEvents() {
    return this.prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        club: { select: { id: true, name: true, slug: true } },
        days: { orderBy: { dayNumber: 'asc' }, select: { id: true, dayNumber: true, date: true, title: true, isAttendanceActive: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // GET PUBLISHED EVENT BY ID
  // =========================================================

  async getPublishedEventById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        club: { select: { id: true, name: true, slug: true } },
        days: { orderBy: { dayNumber: 'asc' } },
        agendaItems: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  // =========================================================
  // GET MY EVENTS
  // =========================================================

  async getMyEvents(user: AuthenticatedUser) {
    if (user.role === Role.EVENT_ADMIN || user.role === Role.SUPER_ADMIN) {
      const events = await this.prisma.event.findMany({
        where: {
          createdById: user.userId,
        },
        include: {
          community: { select: { id: true, name: true, slug: true } },
          club: { select: { id: true, name: true, slug: true } },
          approvals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return events.map((event) => ({
        ...event,
        reviewNotes: event.approvals?.[0]?.remarks || null,
      }));
    }

    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.userId },
    });
    const communityIds = memberships
      .map((m) => m.communityId)
      .filter((id): id is string => Boolean(id));
    const clubIds = memberships
      .map((m) => m.clubId)
      .filter((id): id is string => Boolean(id));

    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { createdById: user.userId },
          { communityId: { in: communityIds } },
          { clubId: { in: clubIds } },
        ],
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        club: { select: { id: true, name: true, slug: true } },
        approvals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => ({
      ...event,
      reviewNotes: event.approvals?.[0]?.remarks || null,
    }));
  }

  // =========================================================
  // UPDATE EVENT
  // =========================================================

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canManage = await this.canManageEvent(event, user);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to edit this event');
    }

    // ── Recompute multi-day fields when dates are supplied ──
    const rawStart = updateEventDto.startDate ?? event.startDate.toISOString();
    const rawEnd   = updateEventDto.endDate   ?? event.endDate.toISOString();

    const startDate = startOfDay(new Date(rawStart));
    const endDate   = startOfDay(new Date(rawEnd));
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

    if (totalDays < 1) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const isMultiDay = totalDays > 1;
    const datesChanged =
      updateEventDto.startDate !== undefined ||
      updateEventDto.endDate   !== undefined;

    return this.prisma.$transaction(async (tx) => {
      // Update the core event
      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
          title:       updateEventDto.title,
          description: updateEventDto.description,
          bannerUrl:   updateEventDto.bannerUrl,

          eventDate: updateEventDto.eventDate
            ? new Date(updateEventDto.eventDate)
            : undefined,

          startDate,
          endDate,
          totalDays,
          isMultiDay,

          startTime: updateEventDto.startTime
            ? new Date(updateEventDto.startTime)
            : undefined,

          endTime: updateEventDto.endTime
            ? new Date(updateEventDto.endTime)
            : undefined,

          venue: updateEventDto.venue,
        },
      });

      // Sync EventDay rows only when the date range or labels change
      if (datesChanged || updateEventDto.dayLabels !== undefined) {
        const eventDays = this.buildEventDays(
          startDate,
          endDate,
          updateEventDto.dayLabels,
        );

        // Delete all existing days (cascades to attendances/agenda via onDelete: Cascade/SetNull)
        await tx.eventDay.deleteMany({ where: { eventId: id } });

        // Re-create fresh days
        await tx.eventDay.createMany({
          data: eventDays.map((d) => ({
            eventId:            id,
            dayNumber:          d.dayNumber,
            date:               d.date,
            title:              d.title,
            isAttendanceActive: d.isAttendanceActive,
          })),
        });
      }

      // Return updated event with its days
      return tx.event.findUnique({
        where: { id },
        include: {
          days: { orderBy: { dayNumber: 'asc' } },
        },
      });
    });
  }

  // =========================================================
  // DELETE EVENT
  // =========================================================

  async delete(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(
        'Event not found or you do not have access to it',
      );
    }

    const canManage = await this.canManageEvent(event, user);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to delete this event');
    }

    // 3. Only draft events can be deleted
    if (event.status !== 'DRAFT') {
      throw new ForbiddenException('Only draft events can be deleted');
    }

    // 4. Delete event
    await this.prisma.event.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Event deleted successfully',
    };
  }

  // =========================================================
  // SUBMIT EVENT FOR APPROVAL
  // =========================================================

  async submitForApproval(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(
        'Event not found or you do not have access to it',
      );
    }

    const canManage = await this.canManageEvent(event, user);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to submit this event');
    }

    // 3. Only draft events can be submitted
    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft events can be submitted for approval',
      );
    }

    // 4. Validate required event information
    const missingFields: string[] = [];

    if (!event.title || event.title.trim() === '') {
      missingFields.push('title');
    }

    if (!event.eventDate) {
      missingFields.push('eventDate');
    }

    // 5. Stop submission if required fields are missing
    if (missingFields.length > 0) {
      throw new BadRequestException({
        message: 'Event is incomplete and cannot be submitted',
        missingFields,
      });
    }

    // 6. Submit event for Super Admin approval
    return this.prisma.event.update({
      where: {
        id,
      },
      data: {
        status: 'PENDING_APPROVAL',
      },
    });
  }

  // =========================================================
  // RESUBMIT EVENT AFTER CHANGES REQUESTED
  // =========================================================

  async resubmitForApproval(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(
        'Event not found or you do not have access to it',
      );
    }

    const canManage = await this.canManageEvent(event, user);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to resubmit this event');
    }

    // 3. Resubmission is allowed only when
    //    Super Admin requested changes.
    if (event.status !== 'CHANGES_REQUESTED') {
      throw new BadRequestException(
        'Only events with requested changes can be resubmitted',
      );
    }

    // 4. Send event back for approval
    const missingFields: string[] = [];

    if (!event.title || event.title.trim() === '') {
      missingFields.push('title');
    }

    if (!event.eventDate) {
      missingFields.push('eventDate');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        message: 'Event is incomplete and cannot be resubmitted',
        missingFields,
      });
    }

    return this.prisma.event.update({
      where: {
        id,
      },
      data: {
        status: 'PENDING_APPROVAL',
      },
    });
  }
  // =========================================================
  // PUBLISH EVENT
  // =========================================================

  async publish(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(
        'Event not found or you do not have access to it',
      );
    }

    const canManage = await this.canManageEvent(event, user);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to publish this event');
    }

    // 3. Only approved events can be published
    if (event.status !== 'APPROVED') {
      throw new BadRequestException('Only approved events can be published');
    }

    // 4. Publish event and registration form together
    return this.prisma.$transaction(async (tx) => {
      // Publish the event
      const publishedEvent = await tx.event.update({
        where: {
          id,
        },
        data: {
          status: 'PUBLISHED',
        },
      });

      const latestDraftForm = await tx.eventRegistrationForm.findFirst({
        where: {
          eventId: id,
          status: 'DRAFT',
        },
        orderBy: {
          version: 'desc',
        },
      });

      if (latestDraftForm) {
        await tx.eventRegistrationForm.update({
          where: {
            id: latestDraftForm.id,
          },
          data: {
            status: 'PUBLISHED',
          },
        });
      }

      return publishedEvent;
    });
  }

  // =========================================================
  // EVENT PREVIEW
  // =========================================================

  async getEventPreview(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        agendaItems: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        speakers: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        sponsors: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        registrationForms: {
          where: {
            status: 'DRAFT',
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!event) {
      throw new NotFoundException(
        'Event not found or you do not have access to it',
      );
    }

    const canManage = await this.canManageEvent(event, user);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to preview this event');
    }

    return {
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        bannerUrl: event.bannerUrl,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        status: event.status,
      },

      agenda: event.agendaItems,

      speakers: event.speakers,

      sponsors: event.sponsors,

      registrationForm: event.registrationForms[0] ?? null,
    };
  }
}
