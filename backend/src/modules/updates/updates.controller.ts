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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatesService } from './updates.service';
import { CreateUpdateDto } from './dto/create-update.dto';
import { UpdateUpdateDto } from './dto/update-update.dto';
import { ReviewUpdateDto } from './dto/review-update.dto';
import { RejectUpdateDto } from './dto/reject-update.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Updates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get('my-assignments')
  @ApiOperation({
    summary: 'Get entities where user is Head or Core Member, and their updates',
  })
  getMyAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.updatesService.getMyAssignments(user);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get updates pending Super Admin approval' })
  getPendingUpdates(@CurrentUser() user: AuthenticatedUser) {
    return this.updatesService.getPendingUpdates(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an update (Head or Core Member of entity, or Super Admin)',
  })
  create(
    @Body() dto: CreateUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatesService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit an update' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatesService.update(id, dto, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit an update for Super Admin approval' })
  submit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatesService.submit(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve an update (Super Admin)' })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReviewUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatesService.approve(id, dto, user);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject an update (Super Admin)' })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatesService.reject(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an update' })
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatesService.delete(id, user);
  }
}
