import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchNumbers } from "../Batchs/entities/BatchNumbers";
import { Product } from "src/Entities/Product.entity";
import { Purchases } from "src/Entities/Purchases.Entity";
import { Supplier } from "src/Entities/Supplier.Entity";
import { BatchModule } from "../Batchs/BatchModule";
import { BatchService } from "../Batchs/BatchService";
import { ProductModule } from "../Products/ProductModule";
import { ProductService } from "../Products/ProductService";
import { UsersModule } from "../Users/UsersModule";
import { PurchaseController } from "./PurchaseController";
import { PurchaseService } from "./PurchaseService";
import { UsersService } from "../Users/UserService";
import { UserEntity } from "src/Entities/User.entity";
import { LoginEntity } from "src/Entities/Login.Entity";
import { CategoryModule } from "../category/category.module";
import { BatchEntity } from "../../Entities/BatchEntity";
import { TransactionsModule } from "src/helpers/TransactionsModule";
@Module({
    imports: [
            ProductModule,
            UsersModule,
            BatchModule,
            CategoryModule,
            TransactionsModule,
           TypeOrmModule.forFeature([Purchases, Product, Supplier, BatchNumbers, UserEntity, LoginEntity, BatchEntity])
    ],
    controllers: [PurchaseController],
    providers: [PurchaseService, ProductService, UsersService, BatchService],
    exports: [ PurchaseService]
})
export class PurchaseModule { }