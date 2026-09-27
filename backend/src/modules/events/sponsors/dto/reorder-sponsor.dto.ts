import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ReorderSponsorItemDto {
  @ApiProperty({
    example: '7a859f4c-36df-4326-a70b-a32518ff493f',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  displayOrder!: number;
}

export class ReorderSponsorDto {
  @ApiProperty({
    type: [ReorderSponsorItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderSponsorItemDto)
  items!: ReorderSponsorItemDto[];
}
