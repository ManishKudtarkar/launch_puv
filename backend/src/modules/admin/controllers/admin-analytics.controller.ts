import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { Role } from '../../../generated/prisma/enums';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EVENT_ADMIN, Role.SUPER_ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  // GET /events/:eventId/analytics?dayId=<uuid|all>&status=ALL|PRESENT|ABSENT
  @Get(':eventId/analytics')
  @ApiOperation({ summary: 'Get attendance analytics for an event (optionally per-day)' })
  @ApiQuery({ name: 'dayId', required: false, description: 'Event day UUID, "all", or omit for cumulative' })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'PRESENT', 'ABSENT'] })
  getAnalytics(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getAnalytics(eventId, query, user);
  }

  // GET /events/:eventId/export?dayId=<uuid|all>&status=ALL|PRESENT|ABSENT
  @Get(':eventId/export')
  @ApiOperation({ summary: 'Download CSV attendance export for an event' })
  @ApiQuery({ name: 'dayId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'PRESENT', 'ABSENT'] })
  async exportExcel(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const xlsBuffer = await this.analyticsService.exportExcel(eventId, query, user);
    const dayLabel = query.dayId === 'all' ? 'all-days' : query.dayId ? `day-${query.dayId.slice(-6)}` : 'master';
    const filename = `attendance-${eventId.slice(-8)}-${dayLabel}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': xlsBuffer.length,
    });
    res.send(xlsBuffer);
  }
}
