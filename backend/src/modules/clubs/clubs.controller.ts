import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { AssignMemberDto } from '../communities/dto/assign-member.dto';
import { ToggleStatusDto } from '../communities/dto/toggle-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List clubs (optional filter by communityId, search)' })
  @ApiQuery({ name: 'communityId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('communityId') communityId?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.clubsService.findAll(communityId, user, search);
  }

  @Get(':slugOrId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get club details by slug or id' })
  findOne(
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.clubsService.findOne(slugOrId, user);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create club (Super Admin)' })
  create(@Body() dto: CreateClubDto, @CurrentUser() user: AuthenticatedUser) {
    return this.clubsService.create(dto, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update club (Super Admin or Club Head)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateClubDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle club status (Super Admin)' })
  toggleStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ToggleStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.toggleStatus(id, dto.status, user);
  }

  @Post(':id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign Head or Core Team Member (Super Admin)' })
  assignMember(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.assignMember(id, dto, user);
  }

  @Delete(':id/members/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove team member (Super Admin)' })
  removeMember(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.removeMember(id, userId, user);
  }

  @Post(':id/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow club' })
  follow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.follow(id, user);
  }

  @Delete(':id/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow club' })
  unfollow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubsService.unfollow(id, user);
  }
}
