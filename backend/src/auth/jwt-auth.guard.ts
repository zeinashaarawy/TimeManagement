import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Placeholder: Allow all requests. Replace with JWT validation logic.
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'demoUser', roles: ['hr_manager', 'hr_employee', 'candidate'] }; // For testing guards
    return true;
  }
}
