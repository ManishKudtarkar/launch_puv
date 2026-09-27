import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSponsorDto {
  @ApiProperty({
    example: 'Google',
  })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/google-logo.png',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'Technology partner supporting innovation and developer programs.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://google.com',
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    example: 'Gold',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sponsorshipLevel?: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
