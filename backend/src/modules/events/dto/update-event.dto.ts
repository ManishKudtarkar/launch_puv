// import {
//   IsDateString,
//   IsNotEmpty,
//   IsOptional,
//   IsString,
//   IsUrl,
//   MaxLength,
// } from 'class-validator';

// export class CreateEventDto {
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(200)
//   title!: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(5000)
//   description?: string;

//   @IsOptional()
//   @IsUrl()
//   bannerUrl?: string;

//   @IsDateString()
//   eventDate!: string;

//   @IsOptional()
//   @IsDateString()
//   startTime?: string;

//   @IsOptional()
//   @IsDateString()
//   endTime?: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(300)
//   venue?: string;
// }

import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
