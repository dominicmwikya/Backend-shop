import { IsNotEmpty, IsNumber, Validate, isNotEmpty } from "@nestjs/class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, Min, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

export class purchasedto {
   
    @ApiProperty()
    @IsNumberString()
    @IsNotEmpty()
    price: number;

    @ApiProperty()
    @IsNumberString()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumberString()
    sprice: number;

    @ApiProperty()
    @IsNotEmpty()
    productId: number

    @ApiProperty()
    @IsNotEmpty()
    userId: number

    @ApiProperty()
    supplierId: number
    
}