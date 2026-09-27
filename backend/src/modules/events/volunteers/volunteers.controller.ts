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
import { VolunteersService } from './volunteers.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';

@ApiTags('Volunteers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post('events/:id/volunteers')
  assignVolunteer(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @Body() dto: CreateVolunteerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.volunteersService.assignVolunteer(eventId, dto, user);
  }

  @Get('events/:id/volunteers')
  listVolunteers(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.volunteersService.listVolunteers(eventId, user);
  }

  @Delete('events/:id/volunteers/:volunteerId')
  removeVolunteer(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @Param('volunteerId', new ParseUUIDPipe()) volunteerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.volunteersService.removeVolunteer(eventId, volunteerId, user);
  }

  @Get('volunteers/my-events')
  getMyVolunteerEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.volunteersService.getMyVolunteerEvents(user);
  }
}
