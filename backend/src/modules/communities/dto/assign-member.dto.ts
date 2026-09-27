import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { MembershipRole } from '../../../generated/prisma/enums';

export class AssignMemberDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.HEAD })
  @IsEnum(MembershipRole)
  @IsNotEmpty()
  role!: MembershipRole;
}
