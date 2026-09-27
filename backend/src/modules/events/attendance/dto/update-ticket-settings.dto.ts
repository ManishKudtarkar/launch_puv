import { IsArray, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTicketSettingsDto {
  @IsOptional()
  @IsString()
  ticketReleaseMode?: string; // "IMMEDIATE" | "HOURS_BEFORE" | "CUSTOM_TIME"

  @IsOptional()
  @IsNumber()
  ticketReleaseHours?: number; // e.g. 24, 8

  @IsOptional()
  @IsDateString()
  ticketReleaseCustomDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scannedFieldsConfig?: string[]; // e.g. ["FULL_NAME", "EMAIL", "PHONE", "STUDENT_ID", "BRANCH"]
}
