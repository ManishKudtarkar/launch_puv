import { Module } from '@nestjs/common';

import { AdminEventsController } from './controllers/admin-events.controller';
import { AdminEventsService } from './services/admin-events.service';

@Module({
  controllers: [AdminEventsController],
  providers: [AdminEventsService],
})
export class AdminModule {}
