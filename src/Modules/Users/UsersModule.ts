import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/Modules/Users/entities/User.entity';
import { AuthModule } from '../Auth/AuthModule';
import { EmailModule } from '../Email/Email.Module';
import { UsersService } from './UserService';
import { UsersController } from './UsersController';
import { EmailValidation } from '../Utils/emailValidation';
import { PasswordValidator } from '../Utils/passwordValidator';
import { Bcryptpassword } from '../Utils/bycrpt.util';
import { EmailService } from '../Email/email.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { Email } from '../Email/entities/Email';
import { LoginEntity } from './entities/Login.Entity';
import { AuthService } from '../Auth/AuthService';

@Module({
  imports: [AuthModule,EmailModule, TypeOrmModule.forFeature([UserEntity, Email, LoginEntity])],
  providers: [UsersService, EmailValidation, PasswordValidator, Bcryptpassword, EmailService, JwtService, AuthService],
  controllers: [UsersController],
  exports: [UsersService, EmailValidation, EmailService, Bcryptpassword, JwtService, AuthService],
})
export class UsersModule { }
