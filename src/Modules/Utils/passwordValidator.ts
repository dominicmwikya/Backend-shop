import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class PasswordValidator {

    async validatePassword(password : string): Promise<any> {
            try {
                        
                await this.passwordLength(password);
                const digitRegex = /\d/;
                const lowercaseRegex = /[a-z]/;
                const uppercaseRegex = /[A-Z]/;
                const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

                 
                if (!digitRegex.test(password)) {
                    throw new BadRequestException('Password must contain at least one digit');
                }
                if (!lowercaseRegex.test(password)) {
                    throw new BadRequestException('Password must contain at least one lowercase letter');
                }
                if (!uppercaseRegex.test(password) ) {
                    throw new BadRequestException('Password must contain at least one uppercase letter');
                }
                if (!specialCharRegex.test(password)) {
                    throw new BadRequestException('Password must contain at least one special character');
                }
                    
            } catch (error) {
                if (error instanceof BadRequestException) {
                    throw error;
                }
                else {
                    throw new InternalServerErrorException(`Password validation failed! try again`)
                }
            }
    }

    async passwordLength(password : string): Promise<any> {
        if (password.length < 8) {
            throw new BadRequestException(`Password must be at least 8 characters`);
          }
    }
}
