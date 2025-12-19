import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is attached to request (from JWT/auth middleware)

    // For Phase 1, if no user/auth system exists, we'll allow access
    // In production, this should check: user?.role && requiredRoles.includes(user.role)
    // For now, we'll simulate by checking a header or allow all (can be restricted later)

    // TODO: Replace with actual JWT authentication check
    // For Phase 1, we'll check if a role header is present (for testing)
    // In production: return user?.role && requiredRoles.includes(user.role);

    // Get role from header (case-insensitive header lookup)
    const userRole = 
      request.headers['x-user-role'] || 
      request.headers['X-User-Role'] || 
      request.headers['X-USER-ROLE'] ||
      user?.role;

    if (!userRole) {
      // If no auth system, allow for Phase 1 (will be restricted in production)
      // Uncomment below to enforce role checking:
      // return false;
      return true; // Phase 1: Allow access, will be restricted when JWT is implemented
    }

    // Normalize role for comparison (case-insensitive, handle both underscore and space formats)
    const normalizeRole = (role: string): string => {
      if (!role) return '';
      // Convert to lowercase, replace underscores with spaces, normalize whitespace
      return role.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const normalizedUserRole = normalizeRole(userRole);
    const normalizedRequiredRoles = requiredRoles.map(normalizeRole);

    // Log for debugging
    console.log('[RolesGuard] Role check:', {
      endpoint: `${request.method} ${request.url}`,
      userRole,
      normalizedUserRole,
      requiredRoles,
      normalizedRequiredRoles,
      hasAccess: normalizedRequiredRoles.includes(normalizedUserRole),
      headers: {
        'x-user-role': request.headers['x-user-role'],
        'X-User-Role': request.headers['X-User-Role'],
        'X-USER-ROLE': request.headers['X-USER-ROLE'],
      },
    });

    const hasAccess = normalizedRequiredRoles.includes(normalizedUserRole);
    
    if (!hasAccess) {
      console.warn('[RolesGuard] Access denied:', {
        endpoint: `${request.method} ${request.url}`,
        userRole,
        normalizedUserRole,
        requiredRoles,
        normalizedRequiredRoles,
        headers: {
          'x-user-role': request.headers['x-user-role'],
          'x-user-id': request.headers['x-user-id'],
        },
      });
      
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. ` +
        `Your role: ${userRole || 'not provided'}. ` +
        `Please ensure you have the correct permissions or contact your administrator.`
      );
    }

    return true;
  }
}
