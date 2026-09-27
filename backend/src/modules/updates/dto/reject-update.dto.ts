import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectUpdateDto {
  @ApiProperty({ example: 'Please provide more details on registration link' })
  @IsString()
  @IsNotEmpty({ message: 'Review remarks are required when rejecting an update' })
  remarks!: string;
}
