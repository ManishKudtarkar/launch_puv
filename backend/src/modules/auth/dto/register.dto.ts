import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserType } from '../../../generated/prisma/enums';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserType)
  userType!: UserType;

  @IsOptional()
  @IsString()
  department?: string;

  // ── Fresher path ──────────────────────────────────────────────────────────

  /** 1st-year fresher temporary ID, e.g. "26UG123456" */
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}UG\d{6}$/, {
    message: 'UG Number must be in the format YYUGXXXXXX (e.g., 26UG123456)',
  })
  ugNumber?: string;

  // ── Regular / Senior student path ─────────────────────────────────────────

  /** Permanent enrollment number for senior students, e.g. "21010112001" */
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,}$/, {
    message: 'enrollmentNumber must be a numeric string of at least 10 digits',
  })
  enrollmentNumber?: string;
}