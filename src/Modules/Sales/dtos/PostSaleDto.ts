import { IsNotEmpty, IsNumberString, IsString } from "class-validator";
import { UserEntity } from "src/Modules/Users/entities/User.entity";

export class PostSaleDto  {
    @IsNumberString()
    @IsNotEmpty()
    productId: number;

    @IsNumberString()
    @IsNotEmpty()
    purchaseId :number;

    @IsNotEmpty()
    batchId: number;

    @IsNotEmpty()
    @IsNumberString()
    userId: number;
    
    @IsNumberString()
    price: number;

    @IsString()
    customer_name: string;

    @IsNumberString()
    qty: number;

    @IsNotEmpty()
    @IsNumberString()
    purchaseQty: number;

    product_name : string;
    @IsNumberString()

    total: number;
    @IsNumberString()
    @IsNotEmpty()
    
    balance : number
    user: UserEntity
}




