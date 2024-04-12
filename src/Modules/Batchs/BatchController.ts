import { Controller } from "@nestjs/common";
import { BatchService } from "./BatchService";
@Controller()
export class BatchController{
 constructor(private batchService: BatchService){}

 async  generatePurchaseBatchNumber(){
     return await this.batchService.generateBatchNumber();
 }
}