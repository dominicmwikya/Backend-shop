import { Injectable } from "@nestjs/common";
import { ITransactionManager } from "src/Interfaces/transactionManager";
import { EntityManager, QueryRunner } from "typeorm";

@Injectable()
export class Transactions implements ITransactionManager {
    private queryRuner: QueryRunner;

    constructor(private readonly entityManager: EntityManager) {
        this.queryRuner = this.entityManager.connection.createQueryRunner();
    }

    async connectAndStartTransaction(queryRunner: QueryRunner): Promise<void> {
        this.queryRuner = queryRunner;
        await this.queryRuner.connect();
        await this.queryRuner.startTransaction()
    }

    async commitTransaction(queryRunner: QueryRunner): Promise<void> {
        await this.queryRuner.commitTransaction();
    }
    async rollbackTransaction(queryRunner: QueryRunner): Promise<void> {
        await this.queryRuner.rollbackTransaction();
    }
    async releaseQueryRunner(queryRunner: QueryRunner): Promise<void> {
        await this.queryRuner.release();
    }
}