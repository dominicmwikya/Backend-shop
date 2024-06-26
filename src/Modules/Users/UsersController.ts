import { BadRequestException, Body, ConflictException, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Req, Res, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./UserService";
import { CreateUserDto } from './dtos/CreateUserDto';
import { UserEntity } from "./entities/User.entity";
import { EmailValidation } from "../Utils/emailValidation";
import { PasswordValidator } from "../Utils/passwordValidator";
import { signInDTO } from "../Auth/siginInDTO";
import { SuccessResult } from "../Utils/SuccessResult";
import { UserChangePassDTO } from "./dtos/UserChangePassDTO";
import { JSONResponse, Result } from "../category/Response/Result";
import { AuthService } from "../Auth/AuthService";
import { Request, Response } from "express";
import { FindOneParams } from "./dtos/FindOneParams";
@Controller('users')
export class UsersController {
	constructor(private userService: UsersService,
		private emailValidator: EmailValidation,
		private readonly passwordValidator: PasswordValidator,
		private readonly authService: AuthService
	) { }

	@Get('/token-verification')
	protectedRoute(@Req() req: Request, @Res() res: Response) {
		const user = req['user'];
		const token = req.cookies['access-token'];

		return res.status(200).json({ 'success': true, token: token, user: user });
	}

	@Post('/logout')
	async logout(@Req() req: Request, @Res() res: Response) {
		res.clearCookie('access-token', {
			httpOnly: true,
			sameSite: 'none',
			secure: true,
		});
		return res.status(200).json(new Result(true, 'User logged out'));
	}
	@Post('/create')
	async createUser(@Body() user: CreateUserDto) {
		const { email, password } = user;

		try {
			await this.passwordValidator.validatePassword(password);
		} catch (error) {
			throw error;
		}

		const validemail = await this.emailValidator.validateEmail(email);
		if (!validemail) {
			return {
				error: `Invalid email string ${email} please use a valid email value`
			}
		}

		try {
			await this.userService.createUser(user);
			return {
				message: `User ${user.id} created successfully. Check email ${user.email} for account activation`
			};
		} catch (error) {
			throw error;
		}
	}

	@Post('/login')
	async signIn(@Body() data: signInDTO, @Res({ passthrough: true }) res: Response) {
		try {
			const response = await this.userService.Signin(data.email, data.password);
			if (!response) {
				return res.status(500).json({ success: false, message: 'Sign-in failed', error: 'Empty response' });
			}

			res.cookie('access-token', response.accessToken, {
				httpOnly: true,
				sameSite: 'none',
				secure: true,
			});

			return { success: true, message: 'OKAY', user: response.userdata, token: response.accessToken }
		} catch (error) {
			return { sucess: false, message: error };
		}
	}

	//Get all users
	@Get()
	async getUsers() {
		try {
			const users: any = await this.userService.findAll();
			return {
				data: users
			}
		} catch (error) {
			return {
				error: "Failed to fetch users"
			}
		}
	}

	@Delete('/:id')
	async deleteUser(@Param() param: FindOneParams) {
		try {
			const { id } = param
			await this.userService.deleteUser(id);
			return { message: 'User deleted successfully' };
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			} else {
				throw new InternalServerErrorException('Failed to delete user');
			}
		}
	}

	@Put('/:id')
	async updateUser(@Param('id') id: number, @Body() data: UserEntity) {
		console.log(data)
		try {
			await this.userService.updateUserRecord(id, data);
			return { message: ` user with id ${id}  updated successfully` }
		} catch (error) {
			throw error;
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


	//Change password logged in user
	@Post('/password/change')
	async UserChangePasswordRequest(@Body('formData') formData: UserChangePassDTO) {
		const { password, confirmPassword } = formData;
		try {
			if (password !== confirmPassword) {
				throw new BadRequestException(`password and confirm password do not match! `);
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
				return await this.userService.UserChangePaswordRequest(formData);
			} catch (error) {
				if (error instanceof InternalServerErrorException) {
					return new SuccessResult(false, error.message);
				}
				else {
					return new SuccessResult(false, error.message);
				}
			}

		} catch (error) {
			if (error instanceof BadRequestException) {
				return new SuccessResult(false, error.message);
			}
		}
	}

	//admin password reset.
	@Post('/password/reset')
	async ResetPasswordAdminRole(@Body('formData') formData: any) {
		console.log(formData)
		const { password, oldPassword, confirmPassword, email } = formData;
		try {
			if (password !== confirmPassword) {
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
				return await this.userService.resetPasswordByAdmin(email, password);
			} catch (error) {
				if (error instanceof InternalServerErrorException) {
					return new SuccessResult(false, error.message);
				}
				else {
					return new SuccessResult(false, error.message);
				}
			}

		} catch (error) {
			if (error instanceof BadRequestException) {
				return new SuccessResult(false, error.message);
			}
		}

	}
}

