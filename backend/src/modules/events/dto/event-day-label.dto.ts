import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Optional per-day metadata that can be supplied alongside startDate/endDate
 * to give each calendar day of a multi-day event a custom title.
 *
 * Example payload:
 *   dayLabels: [
 *     { dayNumber: 1, title: "Keynote Day" },
 *     { dayNumber: 2, title: "Workshop Day" },
 *   ]
 */
export class EventDayLabelDto {
  /** 1-based index matching the calendar day within startDate…endDate */
  @IsInt()
  @Min(1)
  dayNumber!: number;

  /** Human-readable label for this day (e.g. "Day 1: Keynote") */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  /**
   * Optional ISO date override. When omitted the service derives the date
   * automatically as startDate + (dayNumber - 1) days.
   */
  @IsOptional()
  @IsDateString()
  date?: string;
}
