import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchNumbers } from 'src/Modules/Batchs/entities/BatchNumbers';
import { Product } from "src/Modules/Products/entities/Product.entity";
import { Purchases } from "src/Modules/Purchases/entities/Purchases.Entity";
import { Supplier } from "src/Modules/Suppliers/entities/Supplier.Entity";
import { BatchModule } from "../Batchs/BatchModule";
import { BatchService } from "../Batchs/BatchService";
import { ProductModule } from "../Products/ProductModule";
import { ProductService } from "../Products/ProductService";
import { UsersModule } from "../Users/UsersModule";
import { PurchaseController } from "./PurchaseController";
import { PurchaseService } from "./PurchaseService";
import { UsersService } from "../Users/UserService";
import { UserEntity } from "../Users/entities/User.entity";
import { LoginEntity } from "../Users/entities/Login.Entity";
@Module({
    imports: [
            ProductModule,
            UsersModule,
            BatchModule,
           TypeOrmModule.forFeature([Purchases, Product, Supplier, BatchNumbers, UserEntity, LoginEntity])
    ],
    controllers: [PurchaseController],
    providers: [PurchaseService, ProductService, UsersService],
    exports: [ PurchaseService]
})
export class PurchaseModule { }