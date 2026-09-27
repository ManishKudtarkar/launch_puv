import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ScanQrDto } from './dto/scan-qr.dto';
import { UpdateTicketSettingsDto } from './dto/update-ticket-settings.dto';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // SCAN QR TICKET & MARK ATTENDANCE
  // ============================================================

  async scanQr(
    eventId: string,
    dto: ScanQrDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.verifyScannerAuthorization(eventId, currentUser);

    const now = new Date();
    const token = dto.ticketToken.trim();

    // Find registration by token globally first (token is unique across the system).
    // This prevents false 404s when the volunteer's selected event ID differs from
    // the actual event the ticket was issued for.
    const registrationByToken = await this.prisma.studentRegistration.findFirst({
      where: {
        OR: [
          { ticketToken: token },
          { id: token },
          { ticketToken: { contains: token } },
        ],
      },
    });

    // Resolve which event this token actually belongs to
    const resolvedEventId = registrationByToken?.eventId ?? eventId;

    // If token belongs to a different event, verify the volunteer is authorized for that event too
    if (resolvedEventId !== eventId) {
      await this.verifyScannerAuthorization(resolvedEventId, currentUser);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: resolvedEventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event is already over / expired
    const eventEndTime = event.endTime || event.eventDate;
    const expiryCutoff = new Date(new Date(eventEndTime).getTime() + 24 * 60 * 60 * 1000); // 24h grace after end
    if (now > expiryCutoff && event.status === 'COMPLETED') {
      throw new BadRequestException('This event has concluded. QR code is expired.');
    }

    const registration = await this.prisma.studentRegistration.findFirst({
      where: {
        id: registrationByToken?.id ?? '__none__',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Invalid ticket pass. No registration found for this event.');
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('This registration has been cancelled by the attendee.');
    }

    const alreadyCheckedIn = Boolean(registration.checkedInAt);
    const checkInTime = registration.checkedInAt || now;
    const newScanCount = (registration.scanCount || 0) + 1;

    const volunteerUser = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { fullName: true, email: true },
    });
    const volunteerName = volunteerUser?.fullName || currentUser.email;

    const currentHistory = (
      Array.isArray(registration.scanHistory)
        ? (registration.scanHistory as unknown[])
        : []
    ) as Array<Record<string, unknown>>;

    const scanEntry = {
      volunteerId: currentUser.userId,
      volunteerName,
      scannedAt: now.toISOString(),
      scanNumber: newScanCount,
    };

    const updatedHistory = [...currentHistory, scanEntry];

    // Update attendance record
    const updated = await this.prisma.studentRegistration.update({
      where: { id: registration.id },
      data: {
        checkedInAt: checkInTime,
        checkedInById: registration.checkedInById || currentUser.userId,
        scanCount: newScanCount,
        scanHistory: updatedHistory as unknown as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
          },
        },
        checkedInBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Extract visible fields according to admin's scannedFieldsConfig
    const regData = (updated.registrationData || {}) as Record<string, string>;
    const scannedFieldsConfig = Array.isArray(event.scannedFieldsConfig)
      ? (event.scannedFieldsConfig as string[])
      : null;

    let visibleFields: Record<string, string> = {};

    if (scannedFieldsConfig && scannedFieldsConfig.length > 0) {
      for (const fieldKey of scannedFieldsConfig) {
        if (regData[fieldKey] !== undefined) {
          visibleFields[fieldKey] = regData[fieldKey];
        } else if (fieldKey.toUpperCase() === 'FULL_NAME') {
          visibleFields[fieldKey] = updated.user.fullName;
        } else if (fieldKey.toUpperCase() === 'EMAIL') {
          visibleFields[fieldKey] = updated.user.email;
        }
      }
    } else {
      visibleFields = {
        FULL_NAME: regData.FULL_NAME || updated.user.fullName,
        EMAIL: regData.EMAIL || updated.user.email,
        ...regData,
      };
    }

    return {
      success: true,
      status: alreadyCheckedIn ? 'ALREADY_CHECKED_IN' : 'CHECKED_IN',
      alreadyCheckedIn,
      registrationId: updated.id,
      ticketToken: updated.ticketToken,
      attendeeName: regData.FULL_NAME || updated.user.fullName,
      attendeeEmail: regData.EMAIL || updated.user.email,
      checkedInAt: checkInTime,
      scanCount: newScanCount,
      scannedBy: volunteerName,
      firstScannedBy: updated.checkedInBy?.fullName || volunteerName,
      visibleFields,
      scanHistory: updatedHistory,
    };
  }

  // ============================================================
  // GET ATTENDANCE LIST & METRICS
  // ============================================================

  async getAttendanceList(
    eventId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.verifyScannerAuthorization(eventId, currentUser);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const registrations = await this.prisma.studentRegistration.findMany({
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
            userType: true,
          },
        },
        checkedInBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [{ checkedInAt: 'desc' }, { registeredAt: 'asc' }],
    });

    const totalRegistered = registrations.length;
    const checkedInRegistrations = registrations.filter((r) => r.checkedInAt !== null);
    const totalCheckedIn = checkedInRegistrations.length;
    const checkedInPercentage =
      totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

    const scannedByMe = registrations.filter(
      (r) =>
        r.checkedInById === currentUser.userId ||
        (Array.isArray(r.scanHistory) &&
          (r.scanHistory as Array<{ volunteerId?: string }>).some(
            (s) => s.volunteerId === currentUser.userId,
          )),
    ).length;

    return {
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        status: event.status,
        ticketReleaseMode: event.ticketReleaseMode,
        scannedFieldsConfig: event.scannedFieldsConfig,
        volunteers: event.volunteers,
      },
      metrics: {
        totalRegistered,
        totalCheckedIn,
        pendingCheckIn: totalRegistered - totalCheckedIn,
        checkedInPercentage,
        scannedByMe,
      },
      registrations: registrations.map((r) => {
        const regData = (r.registrationData || {}) as Record<string, string>;
        return {
          id: r.id,
          ticketToken: r.ticketToken,
          attendeeName: regData.FULL_NAME || r.user.fullName,
          attendeeEmail: regData.EMAIL || r.user.email,
          registrationData: regData,
          checkedInAt: r.checkedInAt,
          checkedInById: r.checkedInById,
          checkedInByName: r.checkedInBy?.fullName || null,
          scanCount: r.scanCount || (r.checkedInAt ? 1 : 0),
          scanHistory: r.scanHistory || [],
          registeredAt: r.registeredAt,
        };
      }),
    };
  }

  // ============================================================
  // UPDATE EVENT TICKET SETTINGS (Release time & visible fields)
  // ============================================================

  async updateTicketSettings(
    eventId: string,
    dto: UpdateTicketSettingsDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.verifyEventAdmin(eventId, currentUser);

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.ticketReleaseMode !== undefined && {
          ticketReleaseMode: dto.ticketReleaseMode,
        }),
        ...(dto.ticketReleaseHours !== undefined && {
          ticketReleaseHours: dto.ticketReleaseHours,
        }),
        ...(dto.ticketReleaseCustomDate !== undefined && {
          ticketReleaseCustomDate: dto.ticketReleaseCustomDate
            ? new Date(dto.ticketReleaseCustomDate)
            : null,
        }),
        ...(dto.scannedFieldsConfig !== undefined && {
          scannedFieldsConfig: dto.scannedFieldsConfig as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  // ============================================================
  // AUTHORIZATION HELPERS
  // ============================================================

  private async verifyScannerAuthorization(
    eventId: string,
    user: AuthenticatedUser,
  ) {
    if (user.role === 'SUPER_ADMIN') return;

    // Check if user is event creator/admin
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        createdById: user.userId,
      },
    });

    if (event) return;

    // Check if user is an assigned volunteer for this event
    const volunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.userId,
        },
      },
    });

    if (volunteer) return;

    throw new ForbiddenException(
      'You are not authorized to scan tickets or manage attendance for this event',
    );
  }

  private async verifyEventAdmin(eventId: string, user: AuthenticatedUser) {
    if (user.role === 'SUPER_ADMIN') return;

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        createdById: user.userId,
      },
    });

    if (!event) {
      throw new ForbiddenException(
        'You are not authorized to configure ticket settings for this event',
      );
    }
  }
}
