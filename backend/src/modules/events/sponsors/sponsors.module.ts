import { Module } from '@nestjs/common';

import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';

import { PrismaService } from '../../../database/prisma/prisma.service';

@Module({
  controllers: [SponsorsController],
  providers: [SponsorsService, PrismaService],
})
export class SponsorsModule {}
