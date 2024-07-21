import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../Users/UserService";
import { Bcryptpassword } from "../../helpers/bycrpt.util";
import { IBycryptInterface } from "src/Interfaces/Bycrypt.interface";
import * as bcrypt from 'bcrypt';
import { TokenDTO } from "src/Dtos/tokePayload";
import { UserEntity } from "src/Entities/User.entity";
@Injectable()
export class AuthService implements IBycryptInterface {
    constructor(
        private readonly jwtService: JwtService) { }
    private rounds = 10;
    private salt: string;
    private expiresIn = process.env.EXPIRESIN;
    async saltGenerate(): Promise<any> {
        this.salt = await bcrypt.genSalt(this.rounds);
    }

    async verifyJwtToken(token?: string): Promise<any> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.SECRET_KEY_API_KEY,
            });
            return { id: payload.sub };
        } catch (error) {
           return error;
        }
    }

    async hash(hashString: string): Promise<string> {
        if (!this.salt) {
            await this.saltGenerate();
        }
        return await bcrypt.hash(hashString.toString(), this.salt);
    }

    async compare(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compareSync(password.toString(), hashedPassword);
    }

    async GenerateToken(user: UserEntity): Promise<string> {
        const payload = { username: user.username, sub: user.id, email: user.email, role: [user.role], roles: [user.role], id: user.id };

        return await this.jwtService.signAsync(payload, {
            privateKey: process.env.SECRET_KEY_API_KEY,
            expiresIn: this.expiresIn
        })
    }

    async PasswordResetToken(data: any): Promise<string> {
        return this.jwtService.sign(data, { expiresIn: this.expiresIn })
    }

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
