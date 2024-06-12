import { ApiProperty } from "@nestjs/swagger";
import { UserEntity } from "../entities/User.entity";
import { UserRoles } from "./enumRoles";
import { IsEmail, IsNotEmpty, IsString, isEmail, minLength } from "@nestjs/class-validator";
import { UserStatus } from "../enums/user-enums";
import { IsEnum, MinLength } from "class-validator";
export class CreateUserDto extends UserEntity {
    @ApiProperty({required: true})
    @IsString()
    username: string;
    @ApiProperty({required: true, type: String})
    @IsEmail()
    email: string;

    @ApiProperty({required: true, minimum: 8, type: Number})
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    phone: string;
    @ApiProperty({required: true})
    @IsString()
    @IsNotEmpty()
    password: string;
    @ApiProperty({required: true})
    @IsEnum(UserRoles)
    @IsNotEmpty()
    role: UserRoles
    
    status: UserStatus;
}