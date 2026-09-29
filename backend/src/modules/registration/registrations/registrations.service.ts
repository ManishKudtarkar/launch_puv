import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { isEventExpired } from '../../../common/utils/event-expiry';

import { CreateRegistrationDto } from './dto/create-registration.dto';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

interface SelectedField {
  key: string;
  required: boolean;
}

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================================
  // STUDENT — CREATE REGISTRATION
  // ============================================================

  async create(
    eventId: string,
    createRegistrationDto: CreateRegistrationDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'PUBLISHED',
      },
    });

    if (!event) {
      throw new NotFoundException('Published event not found');
    }

    // Registration is locked once the event has ended (server-side source of
    // truth — the UI hides the form too, but direct API calls must be refused).
    if (isEventExpired(event)) {
      throw new BadRequestException(
        'Registration is closed — this event has already ended.',
      );
    }

    const registrationForm = await this.prisma.eventRegistrationForm.findFirst({
      where: {
        eventId,
        status: 'PUBLISHED',
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!registrationForm) {
      throw new BadRequestException(
        'Registration form is not published for this event',
      );
    }

    const existingRegistration =
      await this.prisma.studentRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.userId,
          },
        },
      });

    if (existingRegistration) {
      throw new ConflictException('You have already registered for this event');
    }

    const selectedFields =
      registrationForm.selectedFields as unknown as SelectedField[];

    const registrationData = createRegistrationDto.registrationData;

    const allowedFields = new Set(selectedFields.map((field) => field.key));

    for (const key of Object.keys(registrationData)) {
      if (!allowedFields.has(key)) {
        throw new BadRequestException(
          `Field '${key}' is not allowed in this registration form`,
        );
      }
    }

    const missingFields: string[] = [];

    for (const field of selectedFields) {
      if (!field.required) {
        continue;
      }

      const value = registrationData[field.key];

      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        missingFields.push(field.key);
      }
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        message: 'Required registration fields are missing',
        fields: missingFields,
      });
    }

    const ticketToken = `PUV-${(event.title || 'EV').slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const registration = await this.prisma.studentRegistration.create({
      data: {
        eventId,
        userId: user.userId,
        formVersion: registrationForm.version,
        registrationData: registrationData as Prisma.InputJsonValue,
        ticketToken,
      },
      include: {
        event: true,
      },
    });

    // Dispatch the confirmation email according to the event's ticket-release
    // timing. Everything here is fire-and-forget so a slow/failed SMTP call
    // never blocks or fails the student's registration HTTP response.
    void this.dispatchRegistrationEmail(
      registration.id,
      event,
      ticketToken,
      user.userId,
    );

    return registration;
  }

  // ============================================================
  // TICKET RELEASE TIMING — EMAIL DISPATCH
  // ============================================================

  /**
   * Computes when the QR ticket should be released for an event, based on its
   * ticketReleaseMode. Returns null for IMMEDIATE (release now) or when the
   * config is incomplete (safe default: release now).
   */
  private computeTicketReleaseTime(event: {
    ticketReleaseMode: string;
    ticketReleaseHours: number;
    ticketReleaseCustomDate: Date | null;
    eventDate: Date;
    startTime: Date | null;
  }): Date | null {
    const mode = (event.ticketReleaseMode || 'IMMEDIATE').toUpperCase();

    if (mode === 'HOURS_BEFORE') {
      const anchor = event.startTime ?? event.eventDate;
      const hours = event.ticketReleaseHours || 0;
      return new Date(new Date(anchor).getTime() - hours * 60 * 60 * 1000);
    }

    if (mode === 'CUSTOM_TIME' && event.ticketReleaseCustomDate) {
      return new Date(event.ticketReleaseCustomDate);
    }

    // IMMEDIATE / DEFAULT / incomplete config → release immediately
    return null;
  }

  /**
   * Sends the appropriate email at registration time:
   *  - IMMEDIATE or release-time already passed → full ticket email (with QR),
   *    and stamps ticketEmailSentAt so the scheduled sweep won't re-send.
   *  - HOURS_BEFORE / CUSTOM_TIME still locked → a "pass locked" confirmation
   *    notice; ticketEmailSentAt stays null so the cron sweep dispatches later.
   * Never throws — the registration is already committed.
   */
  private async dispatchRegistrationEmail(
    registrationId: string,
    event: {
      title: string;
      eventDate: Date;
      venue: string | null;
      ticketReleaseMode: string;
      ticketReleaseHours: number;
      ticketReleaseCustomDate: Date | null;
      startTime: Date | null;
    },
    ticketToken: string,
    userId: string,
  ): Promise<void> {
    try {
      const studentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      });
      if (!studentUser) return;

      const frontendUrl =
        process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
      const ticketsPageUrl = `${frontendUrl}/student/tickets`;

      const releaseTime = this.computeTicketReleaseTime(event);
      const shouldReleaseNow =
        !releaseTime || releaseTime.getTime() <= Date.now();

      if (shouldReleaseNow) {
        const sent = await this.emailService.sendTicketEmail({
          to: studentUser.email,
          studentName: studentUser.fullName,
          eventTitle: event.title,
          eventDate: event.eventDate,
          eventVenue: event.venue ?? null,
          ticketToken,
          ticketsPageUrl,
        });
        if (sent) {
          await this.prisma.studentRegistration.update({
            where: { id: registrationId },
            data: { ticketEmailSentAt: new Date() },
          });
        }
        return;
      }

      // Ticket is locked — send an immediate confirmation notice and leave
      // ticketEmailSentAt null so the release sweep emails the QR pass later.
      const releaseNote = this.buildReleaseNote(event, releaseTime);
      await this.emailService.sendRegistrationPendingEmail({
        to: studentUser.email,
        studentName: studentUser.fullName,
        eventTitle: event.title,
        eventDate: event.eventDate,
        eventVenue: event.venue ?? null,
        releaseNote,
        ticketsPageUrl,
      });
    } catch (error) {
      console.error('❌ [Registration Email Error]:', error);
    }
  }

  private buildReleaseNote(
    event: { ticketReleaseMode: string; ticketReleaseHours: number },
    releaseTime: Date,
  ): string {
    const mode = (event.ticketReleaseMode || '').toUpperCase();
    if (mode === 'HOURS_BEFORE') {
      const h = event.ticketReleaseHours || 0;
      return `Your QR entry pass is locked and will be generated & emailed to you ${h} hour${h === 1 ? '' : 's'} before the event starts.`;
    }
    const formatted = releaseTime.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Your QR entry pass will be automatically released and emailed to you on ${formatted}.`;
  }

  // ============================================================
  // STUDENT — LIST ALL MY REGISTRATIONS (dashboard)
  // ============================================================

  async findAllMine(user: AuthenticatedUser, limit?: number) {
    const take =
      limit && Number.isInteger(limit) && limit > 0
        ? Math.min(limit, 100)
        : undefined;

    return this.prisma.studentRegistration.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        eventId: true,
        status: true,
        ticketToken: true,
        checkedInAt: true,
        registeredAt: true,
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            status: true,
            bannerUrl: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
      ...(take ? { take } : {}),
    });
  }

  // ============================================================
  // STUDENT — GET MY REGISTRATION
  // ============================================================

  async findMyRegistration(eventId: string, user: AuthenticatedUser) {
    // No status filter — the student already registered when the event was PUBLISHED.
    // Their ticket must remain accessible regardless of the event's current status.
    let registration = await this.prisma.studentRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.userId,
        },
      },
      include: {
        event: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('You are not registered for this event');
    }

    if (!registration.ticketToken) {
      const eventRecord = await this.prisma.event.findUnique({
        where: { id: eventId },
      });
      const token = `PUV-${(eventRecord?.title || 'EV').slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      registration = await this.prisma.studentRegistration.update({
        where: { id: registration.id },
        data: { ticketToken: token },
        include: { event: true },
      });
    }

    return registration;
  }

  // ============================================================
  // EVENT ADMIN — GET ALL REGISTRATIONS
  // ============================================================

  async findAll(eventId: string, user: AuthenticatedUser) {
    await this.verifyEventOwnership(eventId, user);

    return this.prisma.studentRegistration.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            userType: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });
  }

  // ============================================================
  // EVENT ADMIN — GET SINGLE REGISTRATION
  // ============================================================

  async findOne(
    eventId: string,
    registrationId: string,
    user: AuthenticatedUser,
  ) {
    await this.verifyEventOwnership(eventId, user);

    const registration = await this.prisma.studentRegistration.findFirst({
      where: {
        id: registrationId,
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            userType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  // ============================================================
  // EVENT ADMIN — REGISTRATION COUNT
  // ============================================================

  async getCount(eventId: string, user: AuthenticatedUser) {
    await this.verifyEventOwnership(eventId, user);

    const count = await this.prisma.studentRegistration.count({
      where: {
        eventId,
        status: 'ACTIVE',
      },
    });

    return {
      eventId,
      totalRegistrations: count,
    };
  }

  // ============================================================
  // STUDENT — CANCEL REGISTRATION
  // ============================================================

  async cancel(
    eventId: string,
    registrationId: string,
    user: AuthenticatedUser,
  ) {
    const registration = await this.prisma.studentRegistration.findFirst({
      where: {
        id: registrationId,
        eventId,
        userId: user.userId,
      },
    });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found or you do not have access to it',
      );
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('Registration is already cancelled');
    }

    return this.prisma.studentRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  // ============================================================
  // EVENT OWNERSHIP CHECK
  // ============================================================

  private async verifyEventOwnership(eventId: string, user: AuthenticatedUser) {
    if (user.role !== 'EVENT_ADMIN') {
      throw new ForbiddenException(
        'Only Event Admins can access event registrations',
      );
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

    return event;
  }
}
