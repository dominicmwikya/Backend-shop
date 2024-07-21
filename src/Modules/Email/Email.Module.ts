import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { EmailController } from "./Email.Controller";

import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailService } from "./email.service";
import { Email } from "../../Entities/Email";
@Module({
    imports: [
        TypeOrmModule.forFeature([Email]),
        MailerModule.forRoot({
            transport: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: "dominicmwikya50@gmail.com",
                    pass: "opoxgjcezvnlhrfi"
                },
                debug: false
            },
        }),

    ],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
