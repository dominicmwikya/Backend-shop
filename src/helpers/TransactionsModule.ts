import { Module } from "@nestjs/common";
import { Transactions } from "src/helpers/Transactions";

@Module({
  providers: [Transactions],
  exports: [Transactions],
})
export class TransactionsModule {}
