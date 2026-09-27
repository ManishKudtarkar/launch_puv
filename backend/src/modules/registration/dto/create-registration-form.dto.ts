import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SelectedRegistrationFieldDto {
  @ApiProperty({
    example: 'TEAM_NAME',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  required!: boolean;
}

export class CreateRegistrationFormDto {
  @ApiProperty({
    type: [SelectedRegistrationFieldDto],
    example: [
      {
        key: 'TEAM_NAME',
        required: true,
      },
      {
        key: 'TEAM_SIZE',
        required: true,
      },
      {
        key: 'PROJECT_TITLE',
        required: true,
      },
      {
        key: 'GITHUB',
        required: false,
      },
    ],
  })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SelectedRegistrationFieldDto)
  selectedFields!: SelectedRegistrationFieldDto[];
}
