import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsNumberString, IsString, ValidateNested, isString } from "class-validator";

export class CreateSaleDto {
    @IsString()
    customer_name: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each : true})
    cart_items: cart_items[];

    @IsNotEmpty()
    @IsNumber()
    grantTotal: number;

    @IsNotEmpty()
    @IsNumber()
    totalItems: number;

    @IsNotEmpty()
    @IsNumber()
    balance: number;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    paymentMethod : string
    paymode: string;
}

class cart_items {
    @IsString()
    // @IsNotEmpty()
    customer_name: string;

    @IsNotEmpty()
    @IsNumber()
    batchId: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    total: number;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    userId: number;


    @IsNotEmpty()
    @IsNumber()
    productId: number;
    
    @IsNotEmpty()
    @IsNumber()
    balance: number;
}