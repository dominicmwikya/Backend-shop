import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/Modules/Users/entities/User.entity';
import { RelationId, Repository } from 'typeorm';
import { Bcryptpassword } from '../Utils/bycrpt.util';
import { EmailService } from '../Email/email.service';
import { CreateUserDto } from './dtos/CreateUserDto';
import { JwtService } from '@nestjs/jwt';
import { SuccessResult } from '../Utils/SuccessResult';
import { UserChangePassDTO } from './dtos/UserChangePassDTO';
import { Result } from '../category/Response/Result';
import { AuthService } from '../Auth/AuthService';
import { LoginEntity } from './entities/Login.Entity';
import { CreateLoginEntityInput } from './interfaces/CreateLoginEntityInput';
@Injectable()
export class UsersService {
	constructor(
		private Bcrypt: Bcryptpassword,
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
		private readonly emailService: EmailService,
		private JwtService : JwtService,
		private readonly authService : AuthService,

		@InjectRepository(LoginEntity)
		private  loginRepository: Repository<LoginEntity>
	) { }


	async findOneByEmail(email: string) {
		return await this.userRepository.findOne({ where: { email: email } });
	}
	async findOne(id: number) {
		return await this.userRepository.findOne({ where: { id: id } });
	}

	async Signin(email: string, pass: string): Promise<any> {
        const user = await this.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException(`Incorrect user name or email address`);
        }
         
		try {
			const passwordMatch = await this.Bcrypt.comparePasswords(pass, user.password);
			if (!passwordMatch) {
				throw new BadRequestException(`Wrong username or email address`);
			}

			const { accessToken, refreshTokens} = await this.authService.getTokens(user);
		
			const newRefreshTokenInput : CreateLoginEntityInput = {
				refreshTokens: refreshTokens, 
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
				user: user,
			};

			const newRefreshToken =  this.loginRepository.create(newRefreshTokenInput);
			await this.loginRepository.save(newRefreshToken);

			const userdata = {
							id: user.id,  
							username: user.username, 
							email: user.email,
							role: user.role, 
							phone:user.phone,
							roles:user.role 
						}

	
			return {success: true, token: accessToken, message:"User Login successful", user: userdata}
		
		} catch (error) {
			if ( error instanceof NotFoundException || error instanceof BadRequestException ) {
				return new Result(false, error.message);
			}
			else {
		
				return new Result(false, `Login failed ${error.message}` )
			}
		}``
    }
 	//ADD USER.
	async createUser(user: CreateUserDto) {
		const { role, username, email, status, phone, password } = user;

		let newUser: any;
		const queryRunner = this.userRepository.manager.connection.createQueryRunner();
		queryRunner.startTransaction();

		try {
			const existingUser = await this.findOneByEmail(email);
			if (existingUser) {
				throw new ConflictException(`${existingUser.email} already exists! Choose a different email.`);
			}

			const hashedPassword = await this.Bcrypt.hashPassword(password);
			const uniquestring = this.generateRandomString();

			user.password = hashedPassword;
			user.code = uniquestring;
			user.status = status;
			user.email = email;
			user.phone = phone;
			user.username = username;
			user.role = role;
			 newUser = await this.userRepository.save(user);
	
			let html : string = `Welcome ${email}! Click this link to activate your account http://localhost:3001/shop/user/account-activation/${uniquestring}`
			let subject: string = 'ACCOUNT ACTIVATION LINK'
			const emailResult = await this.emailService.sendEmail(newUser.email, html,subject);


			if (!(emailResult && emailResult.messageId)) {
				await queryRunner.rollbackTransaction();
				throw new InternalServerErrorException(`USER CREATION FAILED, ERROR SENDING ACTIVATION CODE TO EMAIL ${email}`);
			}
			await queryRunner.commitTransaction();
			return newUser;
		} catch (error) {
			await queryRunner.rollbackTransaction();

			if (error instanceof ConflictException) {
				throw error;
			}
			if (error instanceof InternalServerErrorException) {
				throw error;
			}
			else{
				throw new InternalServerErrorException({ error: error.message});
			}
		} finally {
			await queryRunner.release();
		}
	}
//user requet reset password
	async ResetPasswordEmail (email : string) {
		const user = await this.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException(`Email ${email} Not Found`);
        }
		const usertoken = this.generateRandomString();
		
		try {
			let subject : string ='PASSWORD RESET CODE';
			let html: string =`This email confirms your password reset request. Your usertoken for password reset is ${usertoken}`;
			const emailStatus = await this.emailService.sendEmail(email, html,subject);

			if(!(emailStatus && emailStatus.messageId)) {
				throw new InternalServerErrorException(`Failed to send user activation email`);
			}
			else{
				return new SuccessResult(true,  ` Password reset token send to email ${email} please use the code to reset your password`);
			}			
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				return error;
			}
			else{	
				return error;
			}
		}
	}

	async ResetPasswordUserRequest(token: string, password: string) {
		 try {
				const userByToken = await this.userRepository.find({where: {code : token}});

				if (userByToken.length === 0) {
					throw new NotFoundException(`Invalid user code! Input correct code or request a new code`);
				}

				const hashedPassword = await this.Bcrypt.hashPassword(password);
				userByToken[0].password = hashedPassword;
				await this.userRepository.save(userByToken[0]);

				let subject : string ='PASSWORD RESET SUCCESS';
				let html: string =`User password was sucessfully reset. If you didnt initiate the reset, kindly contact admin`;
				const emailStatus = await this.emailService.sendEmail(userByToken[0].email, html,subject);

				if (!(emailStatus && emailStatus.messageId)) {
					throw new InternalServerErrorException(`Failed to send user activation email`);
				}
				return new SuccessResult(true,  `Password reset success! Login using the new pasword`);

		 } catch (error) {
			if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
				return new SuccessResult(false, error.message);
			}
			else {
				return new SuccessResult(false, error.message);
			}
		 }
	}
	
  //admin password reset
	async resetPasswordByAdmin(email: string, password: string) {
		try {
			const userexist = await this.findOneByEmail(email);
			if (!userexist) {
				throw new NotFoundException(`User Email ${email} not found`);
			}
			const hashedPassword = await this.Bcrypt.hashPassword(password);
			userexist.password = hashedPassword;

			await this.userRepository.save(userexist);

			return new SuccessResult(true, ` Password for ${email} was reset successfully`);

		} catch (error) {
			if (error instanceof ConflictException || error instanceof NotFoundException) {

				return new SuccessResult(false, error.message);
			}
	
			else{
				throw new InternalServerErrorException(`Error occured while reseting user password ${error.message}`);
			}
		}
	}

	  // UserChangePaswordRequest reset
	  async UserChangePaswordRequest(formData: UserChangePassDTO) {
		const {password, email, oldPassword }  = formData
		try {
			const userexist = await this.findOneByEmail(email);
			if (!userexist) {
				throw new NotFoundException(`User Email ${email} not found`);
			}
			const compareOldPassword = await this.Bcrypt.comparePasswords(oldPassword, userexist.password);

			if (!compareOldPassword) {
				throw new NotFoundException(`Invalid Old Password!. Try Again`);
			}
			
			const hashedPassword = await this.Bcrypt.hashPassword(password);
			userexist.password = hashedPassword;

			await this.userRepository.save(userexist);

			return new SuccessResult(true, ` Password for ${email} was reset successfully`);

		} catch (error) {
			if (error instanceof ConflictException || error instanceof NotFoundException) {

				return new SuccessResult(false, error.message);
			}
	
			else{
				throw new InternalServerErrorException(`Error occured while reseting user password ${error.message}`);
			}
		}
	}
 //generate randon string
	private generateRandomString(): string {
		return Math.random().toString(36).slice(2, 9);
	}

	async deleteUser(id: number): Promise<void> {
		const user = await this.findOne(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		await this.userRepository.delete(id);
	}

	async updateUserRecord(id: number, data: UserEntity) {
		try {
			const user = await this.findOne(id);

			if (!user) {
				throw new NotFoundException(`user with id ${id} Not found. Please try again`);
			}

			const { role, email, phone, username, status } = data
			user.username = username;
			user.email = email;
			user.role = role;
			user.phone = phone;
			user.status = status;
			await this.userRepository.save(user);

		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			else{
				throw new InternalServerErrorException(`Error updating user ${id}. ${error.message}`)
			}
		}
	}

	async findAll() {
		return this.userRepository.find();
	}
}
