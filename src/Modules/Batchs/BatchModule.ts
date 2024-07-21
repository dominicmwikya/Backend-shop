import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchNumbers } from "./entities/BatchNumbers";
import { BatchController } from "./BatchController";
import { BatchService } from "./BatchService";
import { Purchases } from "../../Entities/Purchases.Entity";
import { BatchEntity } from "../../Entities/BatchEntity";
@Module({
    imports: [TypeOrmModule.forFeature([BatchNumbers, Purchases, BatchEntity])],
    controllers: [BatchController],
    providers: [BatchService],
    exports: [BatchService]
})

export class BatchModule { }