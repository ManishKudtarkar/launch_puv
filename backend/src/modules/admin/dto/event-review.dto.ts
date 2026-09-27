import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EventReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
