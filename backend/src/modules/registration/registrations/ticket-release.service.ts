import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { EmailService } from '../../email/email.service';

/**
 * Scheduled sweep that releases locked QR tickets.
 *
 * For events configured with HOURS_BEFORE or CUSTOM_TIME ticket release,
 * registration only sends a "pass locked" notice. This job runs every minute,
 * finds registrations whose release time has passed and whose ticket email has
 * not been sent yet (ticketEmailSentAt = null), and dispatches the full QR
 * ticket email. Stamping ticketEmailSentAt makes the sweep idempotent.
 */
@Injectable()
export class TicketReleaseService {
  private readonly logger = new Logger(TicketReleaseService.name);
  private running = false;

  // Safety cap per run so a large backlog can't hammer the SMTP server.
  private static readonly BATCH_SIZE = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'ticket-release-sweep' })
  async releaseDueTickets(): Promise<void> {
    // Skip if the previous run is still in progress (slow SMTP, big batch).
    if (this.running) return;
    this.running = true;

    try {
      const now = Date.now();

      const pending = await this.prisma.studentRegistration.findMany({
        where: {
          status: 'ACTIVE',
          ticketEmailSentAt: null,
          ticketToken: { not: null },
          event: {
            ticketReleaseMode: { in: ['HOURS_BEFORE', 'CUSTOM_TIME'] },
          },
        },
        include: {
          event: {
            select: {
              title: true,
              eventDate: true,
              startTime: true,
              venue: true,
              ticketReleaseMode: true,
              ticketReleaseHours: true,
              ticketReleaseCustomDate: true,
            },
          },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { registeredAt: 'asc' },
      });

      // Filter in memory: release time depends on per-event mode/hours.
      const due = pending
        .filter((r) => {
          const releaseAt = this.computeReleaseTime(r.event);
          return releaseAt !== null && releaseAt.getTime() <= now;
        })
        .slice(0, TicketReleaseService.BATCH_SIZE);

      if (due.length === 0) return;

      this.logger.log(`⏰ Releasing ${due.length} locked QR ticket(s)...`);

      const frontendUrl =
        process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
      const ticketsPageUrl = `${frontendUrl}/student/tickets`;

      for (const reg of due) {
        try {
          const sent = await this.emailService.sendTicketEmail({
            to: reg.user.email,
            studentName: reg.user.fullName,
            eventTitle: reg.event.title,
            eventDate: reg.event.eventDate,
            eventVenue: reg.event.venue ?? null,
            ticketToken: reg.ticketToken as string,
            ticketsPageUrl,
          });

          if (sent) {
            await this.prisma.studentRegistration.update({
              where: { id: reg.id },
              data: { ticketEmailSentAt: new Date() },
            });
          }
          // If not sent, ticketEmailSentAt stays null and the next run retries.
        } catch (error) {
          console.error('❌ [Registration Email Error]:', error);
        }
      }
    } catch (error) {
      console.error('❌ [Ticket Release Sweep Error]:', error);
    } finally {
      this.running = false;
    }
  }

  /** Mirrors RegistrationsService.computeTicketReleaseTime. */
  private computeReleaseTime(event: {
    ticketReleaseMode: string;
    ticketReleaseHours: number;
    ticketReleaseCustomDate: Date | null;
    eventDate: Date;
    startTime: Date | null;
  }): Date | null {
    const mode = (event.ticketReleaseMode || '').toUpperCase();

    if (mode === 'HOURS_BEFORE') {
      const anchor = event.startTime ?? event.eventDate;
      const hours = event.ticketReleaseHours || 0;
      return new Date(new Date(anchor).getTime() - hours * 60 * 60 * 1000);
    }

    if (mode === 'CUSTOM_TIME') {
      return event.ticketReleaseCustomDate
        ? new Date(event.ticketReleaseCustomDate)
        : null;
    }

    return null;
  }
}
