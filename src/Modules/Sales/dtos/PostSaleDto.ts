import { UserEntity } from "src/Modules/Users/entities/User.entity";

export class PostSaleDto  {
    productId: number;
    purchaseId :number;
    batchId: number;
    userId: number;
    price: number;
    customer_name: string;
    qty: number;
    purchaseQty: number;
    product_name : string;
    total: number;
    balance : number
    user: UserEntity
}




