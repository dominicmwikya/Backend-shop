// create-email.dto.ts
import { IsEmail, IsString } from '@nestjs/class-validator'

export class CreateEmailDto {
    @IsEmail()
    recipient: string;

    @IsString()
    subject: string;

    @IsString()
    content: string;
    @IsString()
    sender: string;

}
