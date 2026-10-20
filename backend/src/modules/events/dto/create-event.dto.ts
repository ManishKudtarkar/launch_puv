import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventDayLabelDto } from './event-day-label.dto';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  // Allow both regular https:// URLs and base64 data URIs (for uploaded banner images)
  @Matches(/^(https?:\/\/.+|data:image\/.+;base64,.+)$/, {
    message: 'bannerUrl must be a valid URL or a base64 image data URI',
  })
  bannerUrl?: string;

  @IsDateString()
  eventDate!: string;

  /**
   * Inclusive start date of the event (ISO-8601 date string).
   * For single-day events this should equal endDate.
   */
  @IsDateString()
  startDate!: string;

  /**
   * Inclusive end date of the event (ISO-8601 date string).
   * For single-day events this should equal startDate.
   */
  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  venue?: string;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsUUID()
  clubId?: string;

  @IsOptional()
  @IsString()
  ticketReleaseMode?: string;

  @IsOptional()
  ticketReleaseHours?: number;

  @IsOptional()
  @IsDateString()
  ticketReleaseCustomDate?: string;

  @IsOptional()
  scannedFieldsConfig?: string[];

  /**
   * Optional per-day custom titles for multi-day events.
   * If omitted, days are auto-generated with generic labels ("Day 1", "Day 2" …).
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDayLabelDto)
  dayLabels?: EventDayLabelDto[];
}

