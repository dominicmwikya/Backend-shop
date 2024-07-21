import { IsNumber } from "@nestjs/class-validator";
import { IsNotEmpty, IsNumberString, IsString } from "class-validator";
import { UserEntity } from "src/Entities/User.entity";

export class PostSaleDto  {
    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    purchaseId :number;

    @IsNotEmpty()
    batchId: number;

    @IsNotEmpty()
    @IsNumber()
    userId: number;
    
    paymentMethod: string;
    
    @IsNumber()
    price: number;
     amount: number;
    // @IsNumber()
    qty: number;

    @IsNotEmpty()
    @IsNumber()
    purchaseQty: number;

    product_name : string;
    @IsNumber()

    total: number;
    @IsNumber()
    @IsNotEmpty()
    
    balance : number
    user: UserEntity
}




