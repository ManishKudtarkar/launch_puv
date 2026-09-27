import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Role, UserType } from '../../../generated/prisma/enums';

export class CreateUserDto {
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  @IsEnum(UserType)
  userType!: UserType;
}
