import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BatchNumbers } from "./entities/BatchNumbers";
import { Repository } from "typeorm";
import { Purchases } from "../../Entities/Purchases.Entity";
import { BatchEntity } from "../../Entities/BatchEntity";

@Injectable()
export class BatchService {
    constructor(
        @InjectRepository(BatchNumbers) private batchRepository: Repository<BatchNumbers>,
        @InjectRepository(Purchases) private purchaseRepository: Repository<Purchases>,
        @InjectRepository(BatchEntity) private batchEntityRepository: Repository<BatchEntity>
    ) { }

    async generateBatchNumber(model: any) {
        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        const lastBatch = await this.batchEntityRepository
            .createQueryBuilder('batch')
            .orderBy('batch.createdAt', 'DESC')
            .getOne();

        let batchId = 1;

        if (lastBatch) {
            const lastBatchMonthYear = `${lastBatch.createdAt.getFullYear()}${(lastBatch.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;

            if (lastBatchMonthYear === currentMonthYear) {
                batchId = lastBatch.id + 1;
            }
        }

        const batchNumber = `${model}${currentMonthYear}${now.getDate().toString().padStart(2, '0')}${batchId.toString().padStart(3, '0')}`;
        return batchNumber;
    }

    async findBatchId(id: number) :Promise<BatchEntity> {
        return this.batchEntityRepository.findOne({ where :{ id }})
    }
}
