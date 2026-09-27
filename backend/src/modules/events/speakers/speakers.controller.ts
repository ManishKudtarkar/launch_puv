import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { SpeakersService } from './speakers.service';

import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { ReorderSpeakerDto } from './dto/reorder-speaker.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { Role } from '../../../generated/prisma/enums';

import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@ApiTags('Speakers')
@ApiBearerAuth()
@Controller('events/:eventId/speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  create(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() createSpeakerDto: CreateSpeakerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.create(eventId, createSpeakerDto, user);
  }

  @Get()
  findAll(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.speakersService.findAll(eventId);
  }

  @Get(':speakerId')
  findOne(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('speakerId', new ParseUUIDPipe()) speakerId: string,
  ) {
    return this.speakersService.findOne(eventId, speakerId);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  reorder(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() reorderSpeakerDto: ReorderSpeakerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.reorder(eventId, reorderSpeakerDto, user);
  }

  @Patch(':speakerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  update(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('speakerId', new ParseUUIDPipe()) speakerId: string,
    @Body() updateSpeakerDto: UpdateSpeakerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.update(
      eventId,
      speakerId,
      updateSpeakerDto,
      user,
    );
  }

  @Delete(':speakerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  remove(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('speakerId', new ParseUUIDPipe()) speakerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.remove(eventId, speakerId, user);
  }
}
