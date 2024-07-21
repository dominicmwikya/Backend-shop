import { Body, Controller } from "@nestjs/common";
import { BatchService } from "./BatchService";
@Controller()
export class BatchController{
 constructor(private batchService: BatchService){}

 async  generatePurchaseBatchNumber(@Body('model') model: any){
     return await this.batchService.generateBatchNumber(model);
 }
}