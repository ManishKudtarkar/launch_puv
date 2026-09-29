import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@ApiBearerAuth()
@Controller('registrations')
@UseGuards(JwtAuthGuard)
export class MyRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  // Student — every registration belonging to the authenticated user
  @Get('me')
  @ApiOperation({ summary: "List the current user's event registrations" })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.registrationsService.findAllMine(user, limit);
  }
}
