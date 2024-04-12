import { ApiProperty } from "@nestjs/swagger";

export class signInDTO {
    @ApiProperty()
    email: string;
    @ApiProperty()
    password: string;
}