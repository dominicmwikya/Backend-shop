import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/Modules/Users/entities/User.entity';
import { AuthModule } from '../Auth/AuthModule';
import { EmailModule } from '../Email/Email.Module';
import { UsersService } from './UserService';
import { UsersController } from './UsersController';
import { EmailValidation } from '../Auth/Utils/emailValidation';
import { PasswordValidator } from '../Auth/Utils/passwordValidator';
import { Bcryptpassword } from '../Auth/Utils/bycrpt.util';
import { EmailService } from '../Email/email.service';
import { JwtService } from '@nestjs/jwt';
import { Email } from '../Email/entities/Email';
@Module({
  imports: [forwardRef(() => AuthModule), EmailModule, TypeOrmModule.forFeature([UserEntity, Email])],
  providers: [UsersService, EmailValidation, PasswordValidator, Bcryptpassword, EmailService, JwtService],
  controllers: [UsersController],
  exports: [UsersService, EmailValidation, JwtService, EmailService, Bcryptpassword],
})
export class UsersModule { }
