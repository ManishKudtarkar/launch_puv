import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EntityStatus } from '../../../generated/prisma/enums';

export class ToggleStatusDto {
  @ApiProperty({ enum: EntityStatus, example: EntityStatus.ACTIVE })
  @IsEnum(EntityStatus)
  @IsNotEmpty()
  status!: EntityStatus;
}
