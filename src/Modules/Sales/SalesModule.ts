import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sale } from "src/Modules/Sales/entities/sales.entity";
import { ProductModule } from "../Products/ProductModule";
import { PurchaseModule } from "../Purchases/PurchaseModule";
import { ReceiptModule } from "../Receipts/ReceiptModule";
import { SalesController } from "./SalesController";
import { SaleService } from "./SalesService";

@Module({
    imports: [ProductModule, ReceiptModule, PurchaseModule, TypeOrmModule.forFeature([Sale])],
    controllers: [SalesController],
    providers: [SaleService],
    exports: [SaleService],
})
export class SalesModule { }
