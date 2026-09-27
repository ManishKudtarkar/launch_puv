import { Module } from '@nestjs/common';

import { SpeakersController } from './speakers.controller';
import { SpeakersService } from './speakers.service';

import { PrismaService } from '../../../database/prisma/prisma.service';

@Module({
  controllers: [SpeakersController],
  providers: [SpeakersService, PrismaService],
})
export class SpeakersModule {}
