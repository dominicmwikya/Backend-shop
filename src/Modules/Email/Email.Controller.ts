import { Body, Controller, Post } from "@nestjs/common";
import { UserEntity } from "src/Modules/Users/entities/User.entity";
import { CreateEmailDto } from "./dtos/CreateEmaillDto";
import { EmailService } from "./email.service";
import { Email } from "./entities/Email";

@Controller("email")
export class EmailController {
    constructor(private readonly emailService: EmailService) { }

    @Post('/compose')
    async createEmail(@Body() createEmailDto: CreateEmailDto): Promise<Email | string> {
        return this.emailService.createEmail(createEmailDto);
    }
}
