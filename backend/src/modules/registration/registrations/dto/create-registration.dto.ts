import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({
    example: {
      FULL_NAME: 'Rahul Patel',
      EMAIL: 'rahul@pu.ac.in',
      UNIVERSITY_ID: 'PU12345',
      PHONE_NUMBER: '9876543210',
      COLLEGE: 'Parul University',
      DEPARTMENT: 'Computer Science',
      TEAM_NAME: 'Code Warriors',
      TEAM_SIZE: 4,
      PROJECT_TITLE: 'Smart Campus',
      GITHUB: 'https://github.com/rahul',
    },
  })
  @IsObject()
  registrationData!: Record<string, unknown>;
}
