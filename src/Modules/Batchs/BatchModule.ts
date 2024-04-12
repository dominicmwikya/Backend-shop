import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BatchNumbers } from 'src/Modules/Batchs/entities/BatchNumbers';
import { BatchController } from "./BatchController";
import { BatchService } from "./BatchService";
@Module({
    imports: [TypeOrmModule.forFeature([BatchNumbers])],
    controllers: [BatchController],
    providers: [BatchService],
    exports: [BatchService]
})

export class BatchModule { }