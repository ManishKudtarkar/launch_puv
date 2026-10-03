import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpgradeAccountDto {
  /** The student's new official Parul University email. */
  @IsEmail()
  @IsNotEmpty()
  officialEmail!: string;

  /** The student's permanent enrollment number, e.g. "21010112001". */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,}$/, {
    message: 'enrollmentNumber must be a numeric string of at least 10 digits',
  })
  enrollmentNumber!: string;
}