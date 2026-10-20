import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma/prisma.service';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { Role } from '../../../generated/prisma/enums';
import { AnalyticsQueryDto, AttendanceStatus } from '../dto/analytics-query.dto';
import { buildXlsx } from '../utils/xlsx-builder';

type AttendeeRow = {
  name: string;
  email: string;
  ticketToken: string | null;
  registeredAt: Date;
  checkedInAt: Date | null;
  checkedInBy: string | null;
  status: 'PRESENT' | 'ABSENT';
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureEventAdmin(user: AuthenticatedUser, eventCreatedById: string) {
    if (
      user.role !== Role.SUPER_ADMIN &&
      user.userId !== eventCreatedById
    ) {
      throw new ForbiddenException('Only the event admin or Super Admin can view analytics.');
    }
  }

  // ============================================================
  // GET ANALYTICS  —  GET /events/:eventId/analytics
  // ============================================================

  async getAnalytics(eventId: string, dto: AnalyticsQueryDto, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });

    if (!event) throw new NotFoundException('Event not found.');
    this.ensureEventAdmin(user, event.createdById);

    // ── Master Summary (dayId omitted or empty) ────────────────────────────
    if (!dto.dayId || dto.dayId === '') {
      return this.buildCumulativeSummary(eventId, event, dto.status);
    }

    // ── All-days multi-tab (dayId = "all") ────────────────────────────────
    if (dto.dayId === 'all') {
      const dayResults = await Promise.all(
        event.days.map((d) => this.buildDaySummary(eventId, d.id, d, dto.status)),
      );
      return {
        type: 'multi_day',
        eventTitle: event.title,
        days: dayResults,
      };
    }

    // ── Specific day ──────────────────────────────────────────────────────
    const day = event.days.find((d) => d.id === dto.dayId);
    if (!day) throw new NotFoundException('Event day not found.');
    return this.buildDaySummary(eventId, dto.dayId, day, dto.status);
  }

  // ============================================================
  // EXPORT CSV  —  GET /events/:eventId/export
  // ============================================================

  async exportExcel(eventId: string, dto: AnalyticsQueryDto, user: AuthenticatedUser): Promise<Buffer> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });

    if (!event) throw new NotFoundException('Event not found.');
    this.ensureEventAdmin(user, event.createdById);

    // Multi-sheet workbook when dayId = "all"
    if (dto.dayId === 'all') {
      const sheets: Array<{ name: string; rows: AttendeeRow[] }> = [];
      for (const day of event.days) {
        const label = (day.title ?? `Day ${day.dayNumber}`).slice(0, 31);
        const rows = await this.fetchRows(eventId, day.id, dto.status);
        sheets.push({ name: label, rows });
      }
      return buildXlsx(sheets);
    }

    // Single sheet: specific day or cumulative
    const dayId = dto.dayId && dto.dayId !== '' ? dto.dayId : undefined;
    const rows = await this.fetchRows(eventId, dayId, dto.status);
    const label = dayId
      ? (event.days.find((d) => d.id === dayId)?.title ?? 'Attendance')
      : 'Master Summary';
    return buildXlsx([{ name: label, rows }]);
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private async buildCumulativeSummary(eventId: string, event: any, status?: AttendanceStatus) {
    const rows = await this.fetchRows(eventId, undefined, status);
    const total = rows.length;
    const present = rows.filter((r) => r.status === 'PRESENT').length;
    return {
      type: 'cumulative',
      eventTitle: event.title,
      totalRegistered: total,
      totalPresent: present,
      totalAbsent: total - present,
      turnoutRate: total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0,
      rows,
    };
  }

  private async buildDaySummary(eventId: string, dayId: string, day: any, status?: AttendanceStatus) {
    const rows = await this.fetchRows(eventId, dayId, status);
    const total = rows.length;
    const present = rows.filter((r) => r.status === 'PRESENT').length;
    return {
      type: 'day',
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayTitle: day.title ?? `Day ${day.dayNumber}`,
      date: day.date,
      totalRegistered: total,
      totalPresent: present,
      totalAbsent: total - present,
      turnoutRate: total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0,
      rows,
    };
  }

  private async fetchRows(
    eventId: string,
    dayId: string | undefined,
    status?: AttendanceStatus,
  ): Promise<AttendeeRow[]> {
    // All active registrations for the event
    const registrations = await this.prisma.studentRegistration.findMany({
      where: { eventId, status: 'ACTIVE' },
      include: {
        user: { select: { fullName: true, email: true } },
        checkedInBy: { select: { fullName: true } },
      },
      orderBy: { registeredAt: 'asc' },
    });

    if (dayId) {
      // Per-day: attendance is recorded in EventDayAttendance
      const dayAttendance = await this.prisma.eventDayAttendance.findMany({
        where: { eventDayId: dayId },
        select: { registrationId: true, scannedAt: true },
      });
      const attendanceMap = new Map(dayAttendance.map((a) => [a.registrationId, a.scannedAt]));

      const rows: AttendeeRow[] = registrations.map((r) => {
        const regData = (r.registrationData || {}) as Record<string, string>;
        const checkedInAt = attendanceMap.get(r.id) ?? null;
        return {
          name: regData.FULL_NAME || r.user.fullName,
          email: regData.EMAIL || r.user.email,
          ticketToken: r.ticketToken,
          registeredAt: r.registeredAt,
          checkedInAt,
          checkedInBy: r.checkedInBy?.fullName ?? null,
          status: checkedInAt ? 'PRESENT' : 'ABSENT',
        };
      });

      return this.applyStatusFilter(rows, status);
    }

    // Cumulative: use the master checkedInAt on StudentRegistration
    const rows: AttendeeRow[] = registrations.map((r) => {
      const regData = (r.registrationData || {}) as Record<string, string>;
      return {
        name: regData.FULL_NAME || r.user.fullName,
        email: regData.EMAIL || r.user.email,
        ticketToken: r.ticketToken,
        registeredAt: r.registeredAt,
        checkedInAt: r.checkedInAt,
        checkedInBy: r.checkedInBy?.fullName ?? null,
        status: r.checkedInAt ? 'PRESENT' : 'ABSENT',
      };
    });

    return this.applyStatusFilter(rows, status);
  }

  private applyStatusFilter(rows: AttendeeRow[], status?: AttendanceStatus): AttendeeRow[] {
    if (!status || status === AttendanceStatus.ALL) return rows;
    if (status === AttendanceStatus.PRESENT) return rows.filter((r) => r.status === 'PRESENT');
    return rows.filter((r) => r.status === 'ABSENT');
  }
}
