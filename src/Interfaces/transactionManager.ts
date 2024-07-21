import { QueryRunner } from "typeorm";

export interface ITransactionManager {
    connectAndStartTransaction(queryRunner: QueryRunner):Promise<void>;
    commitTransaction(queryRunner: QueryRunner): Promise<void>;
    rollbackTransaction(query: QueryRunner) : Promise<void>;
    releaseQueryRunner(query: QueryRunner) :Promise<void>;
}

