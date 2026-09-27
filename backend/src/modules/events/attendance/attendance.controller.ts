import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { AttendanceService } from './attendance.service';
import { ScanQrDto } from './dto/scan-qr.dto';
import { UpdateTicketSettingsDto } from './dto/update-ticket-settings.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post(':id/attendance/scan')
  scanQr(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @Body() dto: ScanQrDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.scanQr(eventId, dto, user);
  }

  @Get(':id/attendance/list')
  getAttendanceList(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.getAttendanceList(eventId, user);
  }

  @Patch(':id/ticket-settings')
  updateTicketSettings(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpdateTicketSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.updateTicketSettings(eventId, dto, user);
  }
}
