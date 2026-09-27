import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClubDto {
  @ApiProperty({ example: 'AI & Robotics Club' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'ai-robotics-club' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-community' })
  @IsUUID()
  @IsOptional()
  communityId?: string;

  @ApiPropertyOptional({ example: 'Building the next generation of autonomous systems' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'Detailed description of the club...' })
  @IsString()
  @IsOptional()
  fullDescription?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-of-student' })
  @IsUUID()
  @IsOptional()
  headId?: string;
}
