import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AttendanceStatus {
  ALL = 'ALL',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

export class AnalyticsQueryDto {
  /** UUID of a specific EventDay, or 'all' for master summary. Omit for event-wide cumulative. */
  @IsOptional()
  @IsString()
  dayId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus = AttendanceStatus.ALL;
}
