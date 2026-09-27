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
import { ReorderAgendaDto } from './dto/reorder-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Agenda')
@ApiBearerAuth()
@Controller('events/:eventId/agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  create(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() createAgendaDto: CreateAgendaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.create(eventId, createAgendaDto, user);
  }

  @Get()
  findAll(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.agendaService.findAll(eventId);
  }
  @Patch(':agendaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  update(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('agendaId', new ParseUUIDPipe()) agendaId: string,
    @Body() updateAgendaDto: UpdateAgendaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.update(eventId, agendaId, updateAgendaDto, user);
  }

  @Delete(':agendaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  remove(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('agendaId', new ParseUUIDPipe()) agendaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.remove(eventId, agendaId, user);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EVENT_ADMIN)
  reorder(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() reorderAgendaDto: ReorderAgendaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.reorder(eventId, reorderAgendaDto, user);
  }
}
