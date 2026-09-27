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

import { CreateRegistrationDto } from './dto/create-registration.dto';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

interface SelectedField {
  key: string;
  required: boolean;
}

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.studentRegistration.create({
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
  }

  // ============================================================
  // STUDENT — GET MY REGISTRATION
  // ============================================================

  async findMyRegistration(eventId: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'PUBLISHED',
      },
    });

    if (!event) {
      throw new NotFoundException('Published event not found');
    }

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
      const token = `PUV-${(event.title || 'EV').slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
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
