import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Receipt } from "src/Modules/Receipts/entities/Receipt.entity";
import { ReceiptController } from "./ReceiptController";
import { ReceiptService } from "./ReceiptService";
@Module({
    imports: [TypeOrmModule.forFeature([Receipt])],
    controllers: [ReceiptController],
    providers: [ReceiptService],
    exports: [ReceiptService]
})
export class ReceiptModule { }