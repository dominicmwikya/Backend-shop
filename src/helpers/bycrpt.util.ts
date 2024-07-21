import { Injectable } from '@nestjs/common';
import * as bcrypt from "bcrypt";
import { JwtService } from '@nestjs/jwt';
import { TokenDTO } from '../Dtos/tokePayload';
@Injectable()
export class Bcryptpassword {
	constructor(private jwtService: JwtService){}
	private rounds = 10;
	private salt: string;
	async generateSaltRounds():Promise<any> {
		this.salt = await bcrypt.genSalt(this.rounds);
	}

	async hashPassword<T>(password: T): Promise<string> {
		if (!this.salt) {
			await this.generateSaltRounds();
		}
		const hash = await bcrypt.hash(password.toString(), this.salt);
		return hash;
	}

	async comparePasswords<T>(userpass: T, db_pass: string): Promise<boolean> {
		const isMatch = await bcrypt.compareSync(userpass.toString(), db_pass);
		return isMatch;
	}

	public async GenerateToken(payload: TokenDTO){
		const expiresIn = 60 * 60; 
		const acessToken = await this.jwtService.signAsync(payload, { expiresIn});
		 return {
		  acessToken, 
		  expiresIn
		 }
	  }

	  async PasswordResetToken(data: any, expiresIn: number = 3600) : Promise<string> {
		return this.jwtService.sign(data, {expiresIn});
	}
}
