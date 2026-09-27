import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

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
}

