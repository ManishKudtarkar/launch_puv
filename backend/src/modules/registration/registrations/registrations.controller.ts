import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as QRCode from 'qrcode';

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
  constructor(private readonly registrationsService: RegistrationsService) { }

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

  // Student — QR code PNG for own ticket
  @Get('me/qr')
  async getMyQrCode(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const registration = await this.registrationsService.findMyRegistration(
      eventId,
      user,
    );

    const token = (registration as { ticketToken?: string }).ticketToken;

    if (!token) {
      res.status(404).json({ message: 'Ticket token not found' });
      return;
    }

    const pngBuffer = await QRCode.toBuffer(token, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="ticket-${token}.png"`,
    );
    res.send(pngBuffer);
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
