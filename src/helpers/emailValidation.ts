import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailValidation {
    async validateEmail(email: string): Promise<boolean>{
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
    }
}