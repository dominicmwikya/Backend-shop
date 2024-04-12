import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "../Users/dtos/CreateUserDto";
import { CreateEmailDto } from "./dtos/CreateEmaillDto";
import { Email } from "./entities/Email";

@Injectable()
export class EmailService {
    constructor(
        @InjectRepository(Email)
            private emailRepository: Repository<Email>,
        private mailService: MailerService,
    ) { }


    async sendEmail(email: string, html: string, subject: string) {
        try {
            const response = await this.mailService.sendMail({
                to: email,
                from: process.env.SMTP_USERNAME,
                subject: `${subject}`,
                html: `${html}`,
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
 
 
    async createEmail(createEmailDto: CreateEmailDto): Promise<Email | string> {
        const { recipient, subject, content, sender, } = createEmailDto;
        const newEmail = this.emailRepository.create({
            recipient,
            subject,
            sender,
            content
        });
        const emailSendStatus = await this.mailService.sendMail({
            to: recipient,
            from: process.env.SMTP_USERNAME,
            subject: subject,
            html: content
        })
        if (emailSendStatus && emailSendStatus.messageId) {
            return this.emailRepository.save(newEmail);
        }
        else {
            return "error." + emailSendStatus.error;
        }
    }
}