import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Read fake "auth" from headers
    const userId = request.headers['x-user-id'] as string;
    const role = request.headers['x-user-role'] as string;

    if (!userId || !role) {
      throw new UnauthorizedException(
        'Missing x-user-id or x-user-role header',
      );
    }

    // Attach user object – controller/guards use this
    request.user = {
      id: userId,
      role: role,
    };

    return true;
  }
}
