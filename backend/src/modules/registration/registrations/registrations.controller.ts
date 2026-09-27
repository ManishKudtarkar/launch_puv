import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@ApiBearerAuth()
@Controller('events/:eventId/registrations')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  // Student registration
  @Post()
  create(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() createRegistrationDto: CreateRegistrationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationsService.create(
      eventId,
      createRegistrationDto,
      user,
    );
  }

  // Student — own registration
  @Get('me')
  findMyRegistration(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationsService.findMyRegistration(eventId, user);
  }

  // Event Admin — registration count
  @Get('count')
  getCount(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationsService.getCount(eventId, user);
  }

  // Event Admin — all registrations
  @Get()
  findAll(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationsService.findAll(eventId, user);
  }

  // Event Admin — single registration
  @Get(':registrationId')
  findOne(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationsService.findOne(eventId, registrationId, user);
  }

  // Student — cancel own registration
  @Delete(':registrationId')
  cancel(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationsService.cancel(eventId, registrationId, user);
  }
}
