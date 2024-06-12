import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { Result } from "../category/Response/Result";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly jwtService: JwtService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const token = req.cookies['access-token'];
        if (!token) {
            throw new UnauthorizedException('No auth token supplied');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.SECRET_KEY_API_KEY,
            });


            req['user'] = payload;
            req['token'] = token;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException(`Your session has expired! please login ${error.message}`);
            } else if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException(`Invalid JWT Token ${error.message}`);
            }
            return res.status(401).json(new Result(false, 'Invalid Token'));
        }
    }
}
