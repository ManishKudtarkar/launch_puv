import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RegistrationFormService } from './registration-form.service';
import { CreateRegistrationFormDto } from './dto/create-registration-form.dto';
import { UpdateRegistrationFormDto } from './dto/update-registration-form.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { Role } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Registration Form')
@ApiBearerAuth()
@Controller('events/:eventId/registration-form')
export class RegistrationFormController {
  constructor(
    private readonly registrationFormService: RegistrationFormService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateRegistrationFormDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationFormService.create(eventId, dto, user);
  }

  @Get('public')
  findPublished(@Param('eventId') eventId: string) {
    return this.registrationFormService.findPublished(eventId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationFormService.findByEvent(eventId, user);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  update(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateRegistrationFormDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registrationFormService.update(eventId, dto, user);
  }
}
