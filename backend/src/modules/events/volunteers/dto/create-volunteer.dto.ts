import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVolunteerDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email, user id, or student id
}
