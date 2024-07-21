import { Body, Controller, Post } from "@nestjs/common";
import { UserEntity } from "src/Entities/User.entity";
import { CreateEmailDto } from "../../Dtos/CreateEmaillDto";
import { EmailService } from "./email.service";
import { Email } from "../../Entities/Email";

@Controller("email")
export class EmailController {
    constructor(private readonly emailService: EmailService) { }

    @Post('/compose')
    async createEmail(@Body() createEmailDto: CreateEmailDto): Promise<Email | string> {
        return this.emailService.createEmail(createEmailDto);
    }
}
