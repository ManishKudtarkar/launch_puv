import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../../generated/prisma/enums';

describe('RolesGuard', () => {
  const makeContext = (userRole: Role, requiredRoles: Role[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as any;

    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
      }),
    } as any;

    return { guard, context };
  };

  it('allows a super admin to access event admin routes', () => {
    const { guard, context } = makeContext(Role.SUPER_ADMIN, [Role.EVENT_ADMIN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects users without the required role', () => {
    const { guard, context } = makeContext(Role.PARTICIPANT, [Role.SUPER_ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
