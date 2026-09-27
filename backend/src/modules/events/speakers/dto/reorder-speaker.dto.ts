import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ReorderSpeakerItemDto {
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

export class ReorderSpeakerDto {
  @ApiProperty({
    type: [ReorderSpeakerItemDto],
    example: [
      {
        id: '7a859f4c-36df-4326-a70b-a32518ff493f',
        displayOrder: 1,
      },
      {
        id: '8b969g5d-47ef-5437-b81c-b43629ff604g',
        displayOrder: 2,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderSpeakerItemDto)
  items!: ReorderSpeakerItemDto[];
}
