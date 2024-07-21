import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchNumbers } from "../Batchs/entities/BatchNumbers";
import { Product } from "src/Entities/Product.entity";
import { Purchases } from "src/Entities/Purchases.Entity";
import { BatchModule } from "../Batchs/BatchModule";
import { PurchaseService } from "../Purchases/PurchaseService";
import { ProductController } from './ProductController';
import { ProductService } from "./ProductService";
import { UserEntity } from "src/Entities/User.entity";
import { JwtService } from "@nestjs/jwt";
import { UsersModule } from "../Users/UsersModule";
import { UsersService } from "../Users/UserService";
import { LoginEntity } from "src/Entities/Login.Entity";
import { CategoryEntity } from "../../Entities/CategoryEntity";
import { CategoryServiceService } from "../category/category-service/category-service.service";
import { CategoryModule } from "../category/category.module";
import { TransactionsModule } from "src/helpers/TransactionsModule";
@Module({
    imports: [
        TypeOrmModule.forFeature(
            [
            Product,
            Purchases, 
            BatchNumbers,
            UserEntity,
            LoginEntity,
            CategoryEntity
        ]),
         BatchModule,
         UsersModule,
         CategoryModule,
         TransactionsModule
        ],
    controllers: [ProductController],
    providers: [
        ProductService, 
        PurchaseService, 
        JwtService,
        UsersService,
        CategoryServiceService
    ],
    exports: [ProductService]
})
export class ProductModule { }