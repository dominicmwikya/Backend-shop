import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchNumbers } from "src/Modules/Batchs/entities/BatchNumbers";
import { Product } from "src/Modules/Products/entities/Product.entity";
import { Purchases } from "src/Modules/Purchases/entities/Purchases.Entity";
import { BatchModule } from "../Batchs/BatchModule";
import { PurchaseService } from "../Purchases/PurchaseService";
import { ProductController } from './ProductController';
import { ProductService } from "./ProductService";
import { UserEntity } from "../Users/entities/User.entity";
import { JwtService } from "@nestjs/jwt";
@Module({
    imports: [TypeOrmModule.forFeature([Product, Purchases, BatchNumbers, UserEntity]), BatchModule],
    controllers: [ProductController],
    providers: [ProductService, PurchaseService, JwtService],
    exports: [ProductService]
})
export class ProductModule { }