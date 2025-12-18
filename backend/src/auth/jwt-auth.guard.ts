import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    roles: string[];
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Placeholder: Allow all requests. Replace with JWT validation logic.
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    req.user = {
      id: 'demoUser',
      roles: ['hr_manager', 'hr_employee', 'candidate'],
    }; // For testing guards
    return true;
  }
}
