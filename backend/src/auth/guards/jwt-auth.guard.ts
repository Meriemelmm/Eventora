// src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Access token is required',
        error: 'No authorization header provided',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid authorization header format',
        error: 'Expected format: "Bearer <token>"',
      });
    }

    const token = authHeader.substring(7).trim();
    
    if (!token) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Access token is required',
        error: 'Token is empty',
      });
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Access token has expired',
          error: 'Please log in again to continue',
        });
      }

      if (info instanceof NotBeforeError) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Access token is not yet valid',
          error: 'Please wait and try again',
        });
      }

      if (info instanceof JsonWebTokenError) {
        if (info.message.includes('invalid signature')) {
          throw new UnauthorizedException({
            statusCode: 401,
            message: 'Invalid access token',
            error: 'Token signature is invalid',
          });
        }

        if (info.message.includes('malformed') || info.message.includes('invalid token')) {
          throw new UnauthorizedException({
            statusCode: 401,
            message: 'Malformed access token',
            error: 'Please provide a valid token',
          });
        }

        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Invalid access token',
          error: info.message || 'Token validation failed',
        });
      }

      if (err) throw err;

      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Authentication required',
        error: 'Please log in to access this resource',
      });
    }

    return user;
  }
}