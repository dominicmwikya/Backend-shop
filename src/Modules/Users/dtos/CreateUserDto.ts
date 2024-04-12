import { ApiProperty } from "@nestjs/swagger";
import { UserEntity } from "../entities/User.entity";
import { UserRoles } from "./enumRoles";
import { IsEmail, isEmail } from "@nestjs/class-validator";
import { UserStatus } from "../enums/user-enums";
export class CreateUserDto extends UserEntity {
    @ApiProperty({required: true})
    username: string;
    @ApiProperty({required: true, type: String})
    @IsEmail()
    email: string;
    @ApiProperty({required: true, minimum: 8, type: Number})
    phone: string;
    @ApiProperty({required: true})
    password: string;
    @ApiProperty({required: true})
    role: UserRoles
    status: UserStatus;
}