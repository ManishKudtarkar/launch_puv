import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AgendaController } from './agenda/agenda.controller';
import { AgendaService } from './agenda/agenda.service';
import { SpeakersModule } from './speakers/speakers.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { VolunteersController } from './volunteers/volunteers.controller';
import { VolunteersService } from './volunteers/volunteers.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';

@Module({
  controllers: [
    EventsController,
    AgendaController,
    VolunteersController,
    AttendanceController,
  ],
  providers: [
    EventsService,
    AgendaService,
    VolunteersService,
    AttendanceService,
  ],
  imports: [SpeakersModule, SponsorsModule],
  exports: [EventsService, VolunteersService, AttendanceService],
})
export class EventsModule {}
