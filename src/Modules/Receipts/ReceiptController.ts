import { Controller, Get, Query } from "@nestjs/common";
import { ReceiptService } from "./ReceiptService";
@Controller('receipts')
export class ReceiptController {
    constructor(private ReceiptService: ReceiptService) { }

}