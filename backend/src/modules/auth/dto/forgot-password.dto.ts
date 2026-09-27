import { IsEmail } from 'class-validator';
import { IsUniversityEmail } from '../../../common/validator/is-university-email.validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsUniversityEmail()
  email!: string;
}
