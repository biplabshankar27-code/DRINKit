import { createParamDecorator, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: { switchToHttp: () => { getRequest: () => Request & { user?: JwtPayload } } }) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
