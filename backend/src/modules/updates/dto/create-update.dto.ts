import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUpdateDto {
  @ApiProperty({ example: 'Annual Hackathon Announced!' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'We are thrilled to announce...' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-of-community' })
  @IsUUID()
  @IsOptional()
  communityId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-club' })
  @IsUUID()
  @IsOptional()
  clubId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  submitForApproval?: boolean;
}
