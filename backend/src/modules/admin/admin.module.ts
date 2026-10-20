import { Module } from '@nestjs/common';

import { AdminEventsController } from './controllers/admin-events.controller';
import { AdminEventsService } from './services/admin-events.service';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminAnalyticsService } from './services/admin-analytics.service';

@Module({
  controllers: [AdminEventsController, AdminAnalyticsController],
  providers: [AdminEventsService, AdminAnalyticsService],
})
export class AdminModule {}
