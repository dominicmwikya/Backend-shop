import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../Users/UserService";
import { Bcryptpassword } from "../Utils/bycrpt.util";
@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    async getTokens(user: any) {

        const payload = { username: user.username, sub: user.id, email: user.email, role: [user.role], roles: [user.role], id: user.id };

        return {
            accessToken: await this.jwtService.signAsync(payload, {
                privateKey: process.env.SECRET_KEY_API_KEY,
                expiresIn: '1hr'
            }),

            refreshTokens: await this.jwtService.signAsync(payload, { privateKey: process.env.TOKEN_REFRESH_KEY, expiresIn: '7d' })
        };
    }

    async refreshToken(token: string) {
        const payload = this.jwtService.verify(token, { ignoreExpiration: true });

        return {
            access_token: this.jwtService.signAsync({ username: payload.username, sub: payload.sub })
        }
    }
}
