import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private reflector: Reflector,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromCookie(request);
		
		if (!token) {
			throw new UnauthorizedException("You must log in to access the app services");
		}
		try {
			const payload = await this.jwtService.verifyAsync(
				token,
				{
					secret: process.env.SECRET_KEY_API_KEY
				}
			);
			const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
				context.getHandler(),
				context.getClass(),
			]);
			if (requiredRoles) {
				const hasRole = requiredRoles.some(role => payload.roles.includes(role));
				if (!hasRole) {
					throw new UnauthorizedException('ACCESS DENIED : CONTACT SYSTEM ADMINISTRATOR FOR HELP');
				}
			}
			request['user'] = payload;
		} catch (error) {
			if (error instanceof TokenExpiredError) {
				throw new UnauthorizedException(`Your session has expired! Please login again. ${error.message}`);
			} else if (error instanceof JsonWebTokenError) {
				throw new UnauthorizedException(`Invalid JWT Token. ${error.message}`);
			}
			throw error;
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}

	private extractTokenFromCookie(request: Request): string | undefined {
		return request.cookies['access-token']; // 'access-token' should match the cookie name
	}
	
}
