import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import {
  REGISTRATION_FIELDS,
  RegistrationFieldDefinition,
} from './fields/registration-fields.catalog';
import { CreateRegistrationFormDto } from './dto/create-registration-form.dto';
import { UpdateRegistrationFormDto } from './dto/update-registration-form.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Role } from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class RegistrationFormService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify that the event exists and belongs to the logged-in Event Admin.
   */
  private async getOwnedEvent(eventId: string, user: AuthenticatedUser) {
    if (user.role !== Role.EVENT_ADMIN) {
      throw new ForbiddenException(
        'Only Event Admins can manage registration forms',
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

  /**
   * Create a registration form for an Event Admin's own event.
   */
  async create(
    eventId: string,
    dto: CreateRegistrationFormDto,
    user: AuthenticatedUser,
  ) {
    await this.getOwnedEvent(eventId, user);

    //It should also prevent creating a new registration form after approval/publication has started.
    const event = await this.getOwnedEvent(eventId, user);

    if (event.status !== 'DRAFT' && event.status !== 'CHANGES_REQUESTED') {
      throw new ForbiddenException(
        'Registration form cannot be created in the current event status',
      );
    }

    const fieldMap = new Map<string, RegistrationFieldDefinition>(
      REGISTRATION_FIELDS.map((field) => [field.key, field]),
    );

    const requestedKeys = dto.selectedFields.map((field) => field.key);

    const duplicateKeys = requestedKeys.filter(
      (key, index) => requestedKeys.indexOf(key) !== index,
    );

    if (duplicateKeys.length > 0) {
      throw new BadRequestException(
        `Duplicate fields: ${duplicateKeys.join(', ')}`,
      );
    }

    for (const field of dto.selectedFields) {
      if (!fieldMap.has(field.key)) {
        throw new BadRequestException(
          `Invalid registration field: ${field.key}`,
        );
      }

      const definition = fieldMap.get(field.key);

      if (definition?.systemMandatory && !field.required) {
        throw new BadRequestException(
          `${field.key} is a system mandatory field and cannot be optional`,
        );
      }
    }

    const mandatoryFields = REGISTRATION_FIELDS.filter(
      (field) => field.systemMandatory,
    ).map((field) => field.key);

    const selectedFields = [
      ...mandatoryFields
        .filter((key) => !dto.selectedFields.some((field) => field.key === key))
        .map((key) => ({
          key,
          required: true,
        })),
      ...dto.selectedFields,
    ];

    const existingForm = await this.prisma.eventRegistrationForm.findFirst({
      where: {
        eventId,
        status: 'DRAFT',
      },
      orderBy: {
        version: 'desc',
      },
    });

    const nextVersion = existingForm ? existingForm.version + 1 : 1;

    return this.prisma.eventRegistrationForm.create({
      data: {
        eventId,
        version: nextVersion,
        mandatoryFields,
        selectedFields: selectedFields as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });
  }

  /**
   * Get the current draft registration form.
   * Only the Event Admin who owns the event can access it.
   */
  async findByEvent(eventId: string, user: AuthenticatedUser) {
    await this.getOwnedEvent(eventId, user);

    const form = await this.prisma.eventRegistrationForm.findFirst({
      where: {
        eventId,
        status: 'DRAFT',
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!form) {
      throw new NotFoundException('Registration form not found for this event');
    }

    return form;
  }

  /**
   * Update the current draft registration form.
   */
  async update(
    eventId: string,
    dto: UpdateRegistrationFormDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.getOwnedEvent(eventId, user);
    //event form can only be edited in DRAFT, CHANGES_REQUESTED
    if (
      event.status !== 'DRAFT' &&
      event.status !== 'CHANGES_REQUESTED'
      //event.status !== 'APPROVED' &&
      //event.status !== 'PUBLISHED'
    ) {
      throw new ForbiddenException(
        'Registration form cannot be edited in the current event status',
      );
    }

    const form = await this.prisma.eventRegistrationForm.findFirst({
      where: {
        eventId,
        status: 'DRAFT',
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!form) {
      throw new NotFoundException('Draft registration form not found');
    }

    const fieldMap = new Map<string, RegistrationFieldDefinition>(
      REGISTRATION_FIELDS.map((field) => [field.key, field]),
    );

    const requestedKeys = dto.selectedFields.map((field) => field.key);

    const duplicateKeys = requestedKeys.filter(
      (key, index) => requestedKeys.indexOf(key) !== index,
    );

    if (duplicateKeys.length > 0) {
      throw new BadRequestException(
        `Duplicate fields: ${duplicateKeys.join(', ')}`,
      );
    }

    for (const field of dto.selectedFields) {
      const definition = fieldMap.get(field.key);

      if (!definition) {
        throw new BadRequestException(
          `Invalid registration field: ${field.key}`,
        );
      }

      if (definition.systemMandatory && !field.required) {
        throw new BadRequestException(
          `${field.key} is a system mandatory field and cannot be optional`,
        );
      }
    }

    const mandatoryFields = REGISTRATION_FIELDS.filter(
      (field) => field.systemMandatory,
    ).map((field) => field.key);

    const selectedFields = [
      ...mandatoryFields
        .filter((key) => !dto.selectedFields.some((field) => field.key === key))
        .map((key) => ({
          key,
          required: true,
        })),
      ...dto.selectedFields,
    ];

    return this.prisma.eventRegistrationForm.update({
      where: {
        id: form.id,
      },
      data: {
        mandatoryFields,
        selectedFields: selectedFields as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Public registration form.
   *
   * The event must itself be PUBLISHED.
   */
  async findPublished(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'PUBLISHED',
      },
    });

    if (!event) {
      throw new NotFoundException('Published event not found');
    }

    const form = await this.prisma.eventRegistrationForm.findFirst({
      where: {
        eventId,
        status: 'PUBLISHED',
      },
    });

    if (!form) {
      throw new NotFoundException(
        'Published registration form not found for this event',
      );
    }

    return form;
  }
}
