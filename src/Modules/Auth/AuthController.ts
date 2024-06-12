
import {  Controller, Get, Request, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "./authGuard";
import { Result } from "../category/Response/Result";
@Controller('auth')
export class AuthController {
	@UseGuards(AuthGuard)
	@Get('verify-token')
	GetUserTokenVerification(@Request() req: any) {
		if (req.user) {
			const user = {
				email: req.user.email,
				username: req.user.username,
				userId: req.user.userId,
				phone: req.user.phone,
				role: req.user.role
			}
			const token = req.token;
			const data = { token, user};

		return new Result(true, "User Already Authenticated", data);
		}

	    return new Result(false, `Token Verification Failed`)
	}

	@Get()
	protectedRoute(@Req() req: Request) {
	  const user = req['user'];
	  return new Result(true, 'Welcome', user);
	}
}