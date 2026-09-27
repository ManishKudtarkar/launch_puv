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
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { AssignMemberDto } from './dto/assign-member.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List communities' })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('search') search?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.communitiesService.findAll(user, search);
  }

  @Get(':slugOrId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get community details by slug or id' })
  findOne(
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.communitiesService.findOne(slugOrId, user);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create community (Super Admin)' })
  create(
    @Body() dto: CreateCommunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communitiesService.create(dto, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update community (Super Admin or Community Head)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCommunityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communitiesService.update(id, dto, user);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle community status (Super Admin)' })
  toggleStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ToggleStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communitiesService.toggleStatus(id, dto.status, user);
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
    return this.communitiesService.assignMember(id, dto, user);
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
    return this.communitiesService.removeMember(id, userId, user);
  }

  @Post(':id/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow community' })
  follow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communitiesService.follow(id, user);
  }

  @Delete(':id/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow community' })
  unfollow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communitiesService.unfollow(id, user);
  }
}
