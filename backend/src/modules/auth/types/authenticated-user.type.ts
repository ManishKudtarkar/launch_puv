import { Role, UserType } from '../../../generated/prisma/enums';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  userType: UserType;
  sessionId: string;
}
