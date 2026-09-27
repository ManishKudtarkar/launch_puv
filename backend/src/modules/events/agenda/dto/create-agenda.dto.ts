import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgendaDto {
  @ApiProperty({ example: 'Opening ceremony' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Welcome and introductions' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiProperty({ example: '2026-08-24T09:00:00.000Z', format: 'date-time' })
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({
    example: '2026-08-24T10:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  displayOrder!: number;
}
