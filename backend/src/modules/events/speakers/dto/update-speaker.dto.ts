import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSpeakerDto {
  @ApiPropertyOptional({
    example: 'Dr. Raj Patel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: 'Chief Technology Officer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  designation?: string;

  @ApiPropertyOptional({
    example: 'ABC Technologies',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  organization?: string;

  @ApiPropertyOptional({
    example:
      'Technology leader with 15 years of experience in AI and digital transformation.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/speakers/raj-patel.jpg',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://linkedin.com/in/rajpatel',
  })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
