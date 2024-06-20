import { IsNumber } from "@nestjs/class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class UpdatePurchaseDto {
 
    @ApiProperty()
    @IsNumberString()
    @IsNotEmpty()
    quantity: number;
    
    @ApiProperty()
    @IsNumberString()
    @IsNotEmpty()
    sprice : number;
}
