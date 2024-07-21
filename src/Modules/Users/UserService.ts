import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/Entities/User.entity';
import { Repository, QueryRunner, EntityManager } from 'typeorm';
import { EmailService } from '../Email/email.service';
import { CreateUserDto } from '../../Dtos/CreateUserDto';
import { SuccessResult } from '../../helpers/SuccessResult';
import { UserChangePassDTO } from '../../Dtos/UserChangePassDTO';
import { AuthService } from '../Auth/AuthService';
import { actions, LoginEntity } from "src/Entities/Login.Entity";
import { JSONResponse, Result } from '../category/Response/Result';
import { PasswordHistory } from 'src/Entities/PasswordHistory';
import { UserInterface } from 'src/Interfaces/UserInterface';
import { Transactions } from 'src/helpers/Transactions';
import { UserLog } from 'src/Entities/Userlogs';
import { Role } from 'src/Entities/Role.entity';
import { UserStatus } from 'src/Enums/user-enums';

@Injectable()
export class UsersService implements UserInterface {
	private queryRunner  : QueryRunner;
	constructor(
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
		private readonly emailService: EmailService,
		private readonly authService: AuthService,
		@InjectRepository(PasswordHistory)
		private readonly passwordHistoryRepository: Repository<PasswordHistory>,
		@InjectRepository(LoginEntity)
		private loginRepository: Repository<LoginEntity>,
		private readonly entityManager: EntityManager,
		private readonly Transactions: Transactions
	) { this.queryRunner = this.entityManager.connection.createQueryRunner(); }


	
	async getUserByName(username: string): Promise<UserEntity> {
		const user = await this.entityManager.findOne(UserEntity,{ where: { email: username, flag: 0 } })
		if (!user) {
			return null;
		}
		return user;
	}

	async updateLastLogin(email: string): Promise<void> {
		const loginRecord = await this.entityManager.findOne(LoginEntity, { where: { user: { email } }, relations: ['user'] });
		if (!loginRecord) {
			return;
		}
		loginRecord.last_login = new Date();
		await this.entityManager.save(loginRecord);
	}

	// async handlelogut(email: string) {
	// 	this.updateLastLogin(email);

	// 	}
	async updateRefreshToken(email: string, refreshToken: string): Promise<void> {
         const updating = await this.entityManager.findOne(LoginEntity, { where:{ user: { email}}, relations:['user']});
		 updating.refreshTokens = refreshToken;
		 updating.action =actions.LOGIN;
		 updating.last_login = new Date(Date.now());
		 await this.entityManager.save(updating);
	}

	private CreateResult(success: boolean, message: string, data?: any) {
		return new Result(success, message, data);
	}

	async findUser(identifier: number | string): Promise<UserEntity | undefined> {
		if (typeof identifier === 'number') {
			return await this.userRepository.findOne({ where: { id: identifier, flag: 0 } });
		}
		else {
			return await this.userRepository.findOne({ where: { email: identifier, flag: 0 } });
		}
	}

	async Signin(email: string, password: string) {
		await this.Transactions.connectAndStartTransaction(this.queryRunner);
		try {
			const user = await this.getUserByName(email);
			if (user != null) {
				const passwordMatch = await this.authService.compare(password, user.password);

				if (!passwordMatch) {
					await this.Transactions.rollbackTransaction(this.queryRunner);
					return this.CreateResult(false, `Incorrect password`);
				}
				const accessToken = await this.authService.GenerateToken(user);
				const { refreshTokens } = await this.authService.getTokens(user);
				const refreshTokenData = {
					refreshTokens: accessToken,
					expiresAt: new Date(Date.now() + 60 * 60 * 1000),
					user: user,
				};

				let findUserLoggedRecord = await this.entityManager.findOne(LoginEntity, 
					{where: { user: { email } },
					relations: ['user']
				 })
	
				if (!findUserLoggedRecord) {
					findUserLoggedRecord = this.entityManager.create(LoginEntity,refreshTokenData);
					await this.entityManager.save(findUserLoggedRecord);
				}
				else {
					findUserLoggedRecord.refreshTokens = accessToken;
					findUserLoggedRecord.expiresAt = refreshTokenData.expiresAt;
					findUserLoggedRecord.action = actions.LOGIN;
				    await this.updateRefreshToken(email, accessToken);
				}
		
				await this.Transactions.commitTransaction(this.queryRunner);
				const newUser = {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					phone: user.phone,
					roles: user.role
				};
				return new JSONResponse(true, `${email} logged in sucessfully`, accessToken, newUser)
			}
			await this.Transactions.rollbackTransaction(this.queryRunner);
			return new JSONResponse(false, `User NOT FOUND.`)
		} catch (error) {
			await this.Transactions.rollbackTransaction(this.queryRunner);
			return new JSONResponse(false, `Login Error! ${error.message}`);
		}
		finally{
			// await this.Transactions.releaseQueryRunner(this.queryRunner);
		}
	}

	async createUser(user: CreateUserDto) {
		const { role, username, email, phone, password } = user;
		let newUser: any;
		const queryRunner = this.userRepository.manager.connection.createQueryRunner();
		queryRunner.startTransaction();

		try {
			const existingUser = await this.findUser(email);
			if (existingUser) {
				return new Result(false, `${existingUser.email} already exists! Choose a different email.`)
			}
			const hashedPassword = await this.authService.hash(password);
			const uniquestring = this.generateRandomString();

			user.password = hashedPassword;
			user.code = uniquestring;
			user.email = email.toLowerCase();
			user.phone = phone;
			user.username = username;
			user.role = role;

			newUser = await this.userRepository.save(user);

			const passHistory = this.passwordHistoryRepository.create({ passwordHash: hashedPassword, user: newUser });
			await this.passwordHistoryRepository.save(passHistory);

			let html: string = `Welcome ${email}! Click this link to activate your account http://localhost:3001/user/account-activation/${uniquestring}`
			let subject: string = 'ACCOUNT ACTIVATION LINK';

			const emailResult = await this.emailService.sendEmail(newUser.email, html, subject);

			if (!(emailResult && emailResult.messageId)) {
				await queryRunner.rollbackTransaction();
				throw new InternalServerErrorException(`USER CREATION FAILED, ERROR SENDING ACTIVATION CODE TO EMAIL ${email}`);
			}
			await queryRunner.commitTransaction();
			return new Result(true, `User ${email} added successfully`);
		} catch (error) {
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
			}

			if (error || error instanceof ConflictException || error instanceof InternalServerErrorException) {
				return new Result(false, `${error.message}`);
			}
			else {
				return new Result(false, `${error.message}`);
			}

		} finally {
			await queryRunner.release();
		}
	}
	//user requet reset password
	async ResetPasswordEmail(email: string) {
		const user = await this.findUser(email);
		if (!user) {
			throw new NotFoundException(`Email ${email} Not Found`);
		}
		const usertoken = this.generateRandomString();

		try {
			let subject: string = 'PASSWORD RESET CODE';
			let html: string = `This email confirms your password reset request. Your usertoken for password reset is ${usertoken}`;
			const emailStatus = await this.emailService.sendEmail(email, html, subject);

			if (!(emailStatus && emailStatus.messageId)) {
				throw new InternalServerErrorException(`Failed to send user activation email`);
			}
			else {
				return new SuccessResult(true, ` Password reset token send to email ${email} please use the code to reset your password`);
			}
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				return error;
			}
			else {
				return error;
			}
		}
	}

	async ResetPasswordUserRequest(token: string, password: string) {
		try {
			const userByToken = await this.userRepository.find({ where: { code: token, flag: 0 } });

			if (userByToken.length === 0) {
				throw new NotFoundException(`Invalid user code! Input correct code or request a new code`);
			}

			const hashedPassword = await this.authService.hash(password);
			userByToken[0].password = hashedPassword;
			await this.userRepository.save(userByToken[0]);

			let subject: string = 'PASSWORD RESET SUCCESS';
			let html: string = `User password was sucessfully reset. If you didnt initiate the reset, kindly contact admin`;
			const emailStatus = await this.emailService.sendEmail(userByToken[0].email, html, subject);

			if (!(emailStatus && emailStatus.messageId)) {
				throw new InternalServerErrorException(`Failed to send user activation email`);
			}
			return new SuccessResult(true, `Password reset success! Login using the new pasword`);

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
			const userexist = await this.findUser(email);
			if (!userexist) {
				return this.CreateResult(false, `User Email ${email} not found`);
			}
			const hashedPassword = await this.authService.hash(password);
			userexist.password = hashedPassword;
			await this.userRepository.save(userexist);

			return this.CreateResult(true, ` Password for ${email} was reset successfully`);
		} catch (error) {
			return this.CreateResult(false, `${error.message}`);
		}
	}

	// UserChangePaswordRequest reset
	async UserChangePaswordRequest(formData: UserChangePassDTO) {
		const { password, email, oldPassword } = formData
		try {
			const userExists = await this.findUser(email);
			if (!userExists) {
				return this.CreateResult(false, `User Email ${email} not found`)
			}
			const compareOldPassword = await this.authService.compare(oldPassword, userExists.password);
			if (!compareOldPassword) {
				return this.CreateResult(false, `Invalid Old Password!. Try Again`);
			}
			const passwordHistory = await this.passwordHistoryRepository.find({ where: { user: userExists } });
			for (const passhistory of passwordHistory) {

				const passwordhistory = await this.authService.compare(password, passhistory.passwordHash);
				if (passwordhistory) {
					return this.CreateResult(false, `New password should be different from previously used passwords`);
				}
			}

			const hashedPassword = await this.authService.hash(password);

			userExists.password = hashedPassword;

			const newPassHistory = this.passwordHistoryRepository.create({ passwordHash: hashedPassword, user: userExists });
			await this.passwordHistoryRepository.save(newPassHistory);
			await this.userRepository.save(userExists);

			const updatedUser = await this.findUser(email);
			return this.CreateResult(true, ` Password for ${updatedUser.email} was reset successfully`);
		} catch (error) {
			return this.CreateResult(false, `${error.message}`);
		}
	}
	//generate randon string
	private generateRandomString(): string {
		return Math.random().toString(36).slice(2, 9);
	}

	async removeUser(id: number) {
		try {
			const user = await this.findUser(id);
			if (!user) {
				throw new NotFoundException('User not found');
			}
			await this.userRepository.update({ id }, { flag: 1 });
		} catch (error) {
			if (error || error instanceof NotFoundException) {
				return error;
			}
		}
	}

	async updateUserRecord(id: number, data: UserEntity) {
		try {
			const user = await this.findUser(id);
			if (!user) {
				throw new NotFoundException(`user with id ${id} Not found. Please try again`);
			}
			else {
				const { role, email, phone, username, status } = data
				user.username = username;
				user.email = email;
				user.role = role;
				user.phone = phone;
				user.status = status;
				return await this.userRepository.save(user);
			}

		} catch (error) {
			if (error || error instanceof NotFoundException) {
				throw error;
			}
			else {
				throw new InternalServerErrorException(`Error updating user ${id}. ${error.message}`)
			}
		}
	}

	async handleLogout(id: number) {
		const loginRecord = await this.loginRepository.findOne({
			where: {
				user: { id: id},
				// action: actions.LOGIN
			},
			order: {
				createdAt: 'DESC'
			}
		});

		if (loginRecord) {
			loginRecord.action = actions.LOGOUT;
			await this.loginRepository.save(loginRecord);
		}
	}
	async findAll():Promise<UserEntity[]> {
	
		const users =  await this.userRepository.find({ 
			where: { flag: 0 },
			select:['id', 'createDate', 'email','username','phone', 'roles','role', 'status']
		 });
		 return users;
	}
	async getSystemLogs(): Promise<any> {
		return  await this.entityManager.find(UserLog)
	
	}

	async getActiveUsers() {
		return this.loginRepository.find({ where :{ action :actions.LOGIN}});
	}

	async handleLogOut(id?:any){
		const result = await this.loginRepository.update({ user: id }, {action:actions.LOGOUT});

		if (result.affected === 0) {
			throw new Error('Failed to update logout action')
		}
		return result;
	}
}
