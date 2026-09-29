import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminEventsService } from '../services/admin-events.service';
import { EventReviewDto } from '../dto/event-review.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { Role } from '../../../generated/prisma/enums';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@ApiTags('Super Admin - Events')
@ApiBearerAuth()
@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminEventsController {
  constructor(private readonly adminEventsService: AdminEventsService) {}

  @Get('pending')
  @ApiOperation({
    summary: 'Get events pending Super Admin approval',
  })
  getPendingEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.adminEventsService.getPendingEvents(user);
  }

  // Declared before ':id' so "all" isn't parsed as an event UUID.
  @Get('all')
  @ApiOperation({
    summary: 'Get every event across all admins (platform-wide analytics)',
  })
  getAllEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.adminEventsService.getAllEvents(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event details for review',
  })
  getEventForReview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminEventsService.getEventForReview(id, user);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve an event',
  })
  approveEvent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() reviewDto: EventReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminEventsService.approveEvent(id, reviewDto, user);
  }

  @Patch(':id/request-changes')
  @ApiOperation({
    summary: 'Request changes to an event',
  })
  requestChanges(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() reviewDto: EventReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminEventsService.requestChanges(id, reviewDto, user);
  }

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject an event',
  })
  rejectEvent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() reviewDto: EventReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminEventsService.rejectEvent(id, reviewDto, user);
  }
}
