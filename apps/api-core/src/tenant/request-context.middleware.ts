import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { tenantContext } from './tenant-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _: Response, next: NextFunction): void {
    const tenantIdHeader = req.header('x-tenant-id');
    const userIdHeader = req.header('x-user-id');
    const tenantId = tenantIdHeader && tenantIdHeader.length > 0 ? tenantIdHeader : '00000000-0000-0000-0000-000000000000';
    const userId = userIdHeader && userIdHeader.length > 0 ? userIdHeader : 'anonymous';
    tenantContext.set({ tenantId, userId });
    next();
  }
}
