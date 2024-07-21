import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sale } from "src/Entities/sales.entity";
import { ProductModule } from "../Products/ProductModule";
import { PurchaseModule } from "../Purchases/PurchaseModule";
import { ReceiptModule } from "../Receipts/ReceiptModule";
import { SalesController } from "./SalesController";
import { SaleService } from "./SalesService";
import { UsersModule } from "../Users/UsersModule";
import { BatchEntity } from "../../Entities/BatchEntity";

import { TransactionsModule } from "src/helpers/TransactionsModule";
import { BatchModule } from "../Batchs/BatchModule";

@Module({
    imports: [ProductModule, UsersModule,TransactionsModule, ReceiptModule, PurchaseModule, BatchModule, TypeOrmModule.forFeature([Sale, BatchEntity])],
    controllers: [SalesController],
    providers: [SaleService],
    exports: [SaleService],
})
export class SalesModule { }
