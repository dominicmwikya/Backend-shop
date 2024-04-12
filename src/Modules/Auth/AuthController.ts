
import { Body, Controller, Get, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./authGuard";
@Controller('auth')
export class AuthController {
	@UseGuards(AuthGuard)
	@Get('verify-token')
	GetUserTokenVerification(@Request() req: any) {
		if (req.user) {
			return {
				id: req.user.id,
				email: req.user.email,
				username: req.user.username,
				userId: req.user.userId,
				phone: req.user.phone,
				role: req.user.role
			}
		}
		return {
			error: "No valid token found! please login"
		}
	}
}