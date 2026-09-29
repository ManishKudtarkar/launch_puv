import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { UpdatesModule } from './modules/updates/updates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Enables @Cron/@Interval jobs (used for scheduled QR ticket release emails)
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    EventsModule,
    RegistrationModule,
    AdminModule,
    NotificationsModule,
    CommunitiesModule,
    ClubsModule,
    UpdatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
