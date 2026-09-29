import { Module } from '@nestjs/common';
import { RegistrationFieldsController } from './fields/registration-fields.controller';
import { RegistrationFieldsService } from './fields/registration-fields.service';
import { RegistrationFormController } from './registration-form.controller';
import { RegistrationFormService } from './registration-form.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RegistrationsController } from './registrations/registrations.controller';
import { MyRegistrationsController } from './registrations/my-registrations.controller';
import { RegistrationsService } from './registrations/registrations.service';
import { TicketReleaseService } from './registrations/ticket-release.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [
    RegistrationFieldsController,
    RegistrationFormController,
    RegistrationsController,
    MyRegistrationsController,
  ],
  providers: [
    RegistrationFieldsService,
    RegistrationFormService,
    RegistrationsService,
    TicketReleaseService,
    PrismaService,
  ],
  exports: [RegistrationFieldsService, RegistrationFormService],
})
export class RegistrationModule {}
