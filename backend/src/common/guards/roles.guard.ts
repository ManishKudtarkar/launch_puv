import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/enums';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import { ROLES_KEY } from '../decorators/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

const ROLE_PRIORITY: Record<Role, number> = {
  [Role.PARTICIPANT]: 1,
  [Role.EVENT_ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User information is missing');
    }

    const userRolePriority = ROLE_PRIORITY[user.role];

    if (!userRolePriority) {
      throw new ForbiddenException('Invalid user role');
    }

    const hasRequiredRole = requiredRoles.some(
      (requiredRole) =>
        ROLE_PRIORITY[requiredRole] !== undefined &&
        userRolePriority >= ROLE_PRIORITY[requiredRole],
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
