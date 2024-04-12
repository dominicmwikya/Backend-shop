import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from "../Users/UsersModule";
import { AuthController } from "./AuthController";
import { AuthService } from "./AuthService";
import { Bcryptpassword } from "./Utils/bycrpt.util";
import { AuthGuard } from "./authGuard";
import { ConfigModule, ConfigService } from "@nestjs/config";
@Module({
    imports: [UsersModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports:[ConfigModule],
            useFactory: async (ConfigService: ConfigService):Promise<JwtModuleOptions> => ({
                secret: ConfigService.get<string>('SECRET_KEY_API_KEY'),
                signOptions:{
                    expiresIn:'1hr'
                }
            }),
            inject:[ConfigService]
        })
    ],
    providers: [AuthService, Bcryptpassword, AuthGuard],
    controllers: [AuthController],
    exports: [AuthService, Bcryptpassword]
})
export class AuthModule { }