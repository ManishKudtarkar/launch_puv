import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class VolunteersService {
  constructor(private readonly prisma: PrismaService) {}

  async assignVolunteer(
    eventId: string,
    dto: CreateVolunteerDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.verifyEventAdmin(eventId, currentUser);

    const identifier = dto.identifier.trim();

    // Find student/user by ID or Email
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
          { email: { contains: identifier } },
          { fullName: { contains: identifier } },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with identifier '${identifier}' not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.eventVolunteer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `${targetUser.fullName} (${targetUser.email}) is already assigned as a volunteer for this event.`,
      );
    }

    return this.prisma.eventVolunteer.create({
      data: {
        eventId,
        userId: targetUser.id,
        assignedById: currentUser.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
            role: true,
          },
        },
      },
    });
  }

  async listVolunteers(eventId: string, currentUser: AuthenticatedUser) {
    // Both Event Admins and Assigned Volunteers can view volunteer list
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: currentUser.userId,
        },
      },
    });

    if (!isVolunteer && currentUser.role !== 'SUPER_ADMIN') {
      await this.verifyEventAdmin(eventId, currentUser);
    }

    return this.prisma.eventVolunteer.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
            role: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeVolunteer(
    eventId: string,
    volunteerId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.verifyEventAdmin(eventId, currentUser);

    const volunteer = await this.prisma.eventVolunteer.findFirst({
      where: {
        id: volunteerId,
        eventId,
      },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer assignment not found');
    }

    await this.prisma.eventVolunteer.delete({
      where: { id: volunteerId },
    });

    return { message: 'Volunteer removed successfully' };
  }

  async getMyVolunteerEvents(currentUser: AuthenticatedUser) {
    const assignments = await this.prisma.eventVolunteer.findMany({
      where: {
        userId: currentUser.userId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            bannerUrl: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            status: true,
            ticketReleaseMode: true,
            ticketReleaseHours: true,
            ticketReleaseCustomDate: true,
            scannedFieldsConfig: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a) => a.event);
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
        'You are not authorized to manage volunteers for this event',
      );
    }
  }
}
