import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { UserEntity } from "src/Entities/User.entity";
import { CreateUserDto } from '../../Dtos/CreateUserDto';
import { FindOneParams } from "../../Dtos/FindOneParams";
import { UserChangePassDTO } from "../../Dtos/UserChangePassDTO";
import { signInDTO } from "../../Dtos/siginInDTO";
import { SuccessResult } from "../../helpers/SuccessResult";
import { UserResult } from "../../helpers/UserResult";
import { EmailValidation } from "../../helpers/emailValidation";
import { PasswordValidator } from "../../helpers/passwordValidator";
import { AuthService } from "../Auth/AuthService";
import { Result } from "../category/Response/Result";
import { UsersService } from "./UserService";
import { UserLog } from "src/Entities/Userlogs";
@Controller('users')
export class UsersController {
	constructor(private userService: UsersService,
		private emailValidator: EmailValidation,
		private readonly passwordValidator: PasswordValidator,
		private readonly authService: AuthService
	) { }

	private Response(success: boolean, message: string, data?: any, data1?: any) {
		return new UserResult(success, message, data, data1);
	}
	@Get('/token-verification')
	protectedRoute(@Req() req: Request, @Res() res: Response) {
		const user = req['user']
		const token = req.cookies['access-token'];
		return res.status(200).json({ success: true, token: token, user: user });
	}

	@Post('/logout')
	async logout(@Req() req: Request, @Res() res: Response) {
		const token = req.cookies['access-token'];
		try {
			if (token) {
				try {
					const authResult = await this.authService.verifyJwtToken(token);
					const userId = authResult.id
					await this.userService.handleLogOut(userId);
				} catch (error) {
					console.log('Token verification failed:', error.message);
					return res.status(401).json(new Result(false, 'Invalid token, logged out'));
				}
			}

		} catch (error) {
			console.error('Logout Error:', error.message);
			return res.status(500).json(new Result(false, `Logout Error! ${error.message}`));
		}
		finally {
			res.clearCookie('access-token', {
				httpOnly: true,
				sameSite: 'none',
				secure: true,
				expires: new Date(0)
			});
			return res.status(200).json(new Result(true, 'User logged out successfully'));
		}

	}


	@Post('/create')
	async createUser(@Body() user: CreateUserDto) {
		const { email, password } = user;
		const passvalidationErrors = await this.passwordValidator.validatePassword(password);

		if (passvalidationErrors) {
			return new Result(false, `${passvalidationErrors}`);
		}
		const validemail = await this.emailValidator.validateEmail(email);
		if (!validemail) {
			return new Result(false, `Invalid email string ${email} please use a valid email value`);
		}
		try {
			return await this.userService.createUser(user);
		} catch (error) {
			return new Result(false, `${error.message}`);
		}
	}

	@Post('/login')
	async signIn(@Body() data: signInDTO, @Res({ passthrough: true }) res: Response) {
		const { email, password } = data;
		if (!email || !password) {
			return new Result(false, `Email and password fields reqquired`);
		}
		try {
			const response = await this.userService.Signin(data.email, data.password);
			if (!response.success) {
				return response;
			}
			else {
				res.cookie('access-token', response.data, {
					httpOnly: true,
					sameSite: 'none',
					secure: true,
					maxAge: 60 * 60 * 1000
				});
				return response;
			}
		} catch (error) {
			return this.Response(false, `${error.message}`);
		}
	}
	//Get all users
	@Get()
	async getUsers(): Promise<Result> {
		try {
			const users = await this.userService.findAll();
			return new Result(true, ``, users)
		} catch (error) {
			return new Result(false, `${error.message}`);
		}
	}

	@Delete('/:id')
	async deleteUser(@Param() param: FindOneParams) {
		try {
			const { id } = param;
			const idNumber = +id;
			await this.userService.removeUser(idNumber);
			return this.Response(true, `User record successfully deleted from the system!`);
		} catch (error) {
			return this.Response(false, `${error.message}`);
		}
	}

	@Put('/:id')
	async updateUser(@Param('id') id: number, @Body() data: UserEntity) {
		try {
			const idNumber = +id;   //use unary op
			const result = await this.userService.updateUserRecord(idNumber, data);
			return new Result(true, `Update successful`);
		} catch (error) {
			if (error || error instanceof InternalServerErrorException || error instanceof NotFoundException) {
				return error
			}
			return new Result(false, `${error.message}`);
		}
	}

	//user forgot password reset
	@Post('/password-reset')
	async resetPassword(@Body('email') email: string) {
		const validateEmail = await this.emailValidator.validateEmail(email);

		if (!validateEmail) {
			return new SuccessResult(false, `Invalid email string ${email} please use a valid email value`);
		}

		try {
			return await this.userService.ResetPasswordEmail(email);
		} catch (error) {
			return new SuccessResult(false, error.message);
		}
	}
	@Put('password/update')
	async UpdateUserPasswordRequest(token: string, password: string, confirmpassword: string) {
		try {
			if (password !== confirmpassword) {
				throw new BadRequestException(`Passwords do not match`);
			}

			try {
				await this.passwordValidator.validatePassword(password);

			} catch (error) {
				if (error instanceof InternalServerErrorException) {
					return new SuccessResult(false, error.message);
				}
				return new SuccessResult(false, error.message);
			}

			try {
				return this.userService.ResetPasswordUserRequest(token, password);
			} catch (error) {
				return new SuccessResult(false, error.message);
			}
		} catch (error) {
			if (error instanceof BadRequestException) {
				return new SuccessResult(false, error.message);
			}
			else {
				return new SuccessResult(false, error.message);
			}
		}
	}
	private returnResult(success: boolean, message: string, data1?: any, data?: any) {
		return new Result(success, message, data);
	}
	//Change password logged in user
	@Post('/password/change')
	async UserChangePasswordRequest(@Body('formData') formData: UserChangePassDTO) {
		const { password, confirmPassword } = formData;
		if (!password || !confirmPassword) {
			return this.returnResult(false, `Password or confirm password field cannot be empty`);
		}
		if (password !== confirmPassword) {
			return this.returnResult(false, `password and confirm password do not match! `);
		}
		try {
			await this.passwordValidator.validatePassword(password);
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				return this.returnResult(false, error.message);
			}
			return this.returnResult(false, error.message);
		}
		try {
			//process password chnage request here
			return await this.userService.UserChangePaswordRequest(formData);
		} catch (error) {
			return error;
		}
	}
	//admin password reset.
	@Post('/password/reset')
	async ResetPasswordAdminRole(@Body('formData') formData: any) {
		const { password, confirmPassword, userEmail } = formData;
		if (!password || !confirmPassword) {
			return { error: `Password or confirm password field cannot be blank` };
		}

		if (password !== confirmPassword) {
			return { error: "password and confirm password field values do not match" };
		}
		try {

			await this.passwordValidator.validatePassword(password);
		} catch (error) {
			if (error || error instanceof BadRequestException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
				return { success: false, message: error.message };
			} else {
				return { success: false, message: 'An unexpected error occurred during password validation' };
			}
		}
		try {
			return await this.userService.resetPasswordByAdmin(userEmail, password);
		} catch (error) {
			return error;
		}
	}

	@Get('/logs')
	async getLogs(): Promise<UserLog> {
		try {
			const result = await this.userService.getSystemLogs();
			return result
		} catch (error) {
			return error;
		}
	}
}

