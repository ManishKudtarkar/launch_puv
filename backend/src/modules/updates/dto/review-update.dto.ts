import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewUpdateDto {
  @ApiPropertyOptional({ example: 'Approved for publication' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
