import { Controller, Get, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { SupplierService } from "./SupplierService";


@Controller('suppliers')
export class SupplierController {
    constructor(private supplierService: SupplierService) { }

    @Post('/create')
    async createSupplier(@Body() supplier) {
        try {

            const response = await this.supplierService.createSupplier(supplier);
            return response;

        } catch (error: any) {
            return error;
        }
    }

    @Get()
    async fetchSuppliers() {
        try {
            const suppliers = await this.supplierService.getSuppliers();
            return suppliers;
        } catch (error: any) {
            return error
        }
    }

}