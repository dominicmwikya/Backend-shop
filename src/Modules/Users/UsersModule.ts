import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEntity } from 'src/Entities/Login.Entity';
import { PasswordHistory } from 'src/Entities/PasswordHistory';
import { UserEntity } from 'src/Entities/User.entity';
import { Email } from '../../Entities/Email';
import { Bcryptpassword } from '../../helpers/bycrpt.util';
import { EmailValidation } from '../../helpers/emailValidation';
import { PasswordValidator } from '../../helpers/passwordValidator';
import { AuthModule } from '../Auth/AuthModule';
import { AuthService } from '../Auth/AuthService';
import { EmailModule } from '../Email/Email.Module';
import { EmailService } from '../Email/email.service';
import { UsersService } from './UserService';
import { UsersController } from './UsersController';
import { TransactionsModule } from 'src/helpers/TransactionsModule';

@Module({
  imports: [
    AuthModule,
    TransactionsModule,
    EmailModule, TypeOrmModule.forFeature(
      [
        UserEntity, Email, LoginEntity, PasswordHistory
      ])],
  providers: [UsersService, EmailValidation, PasswordValidator, Bcryptpassword, EmailService, JwtService, AuthService],
  controllers: [UsersController],
  exports: [UsersService, EmailValidation, EmailService, Bcryptpassword, JwtService, AuthService],
})
export class UsersModule { }
