import { Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Post, Query } from '@nestjs/common';
import { CreateSaleDto } from './dtos/CreateSaleDTO';
import { SaleService } from './SalesService';
import { PostSaleDto } from './dtos/PostSaleDto';
import { query } from 'express';
@Controller('sales')
export class SalesController {
    constructor(
        private salesService: SaleService,
    ) { }

    @Get('/test') 
    async getAllSales() {
        try {
            return await this.salesService.sales();
        } catch (error) {
            throw error;
        }
    }

    @Post('/test')
    async addRecord(@Body() sale_data : PostSaleDto) {
        try {
            const { productId, qty, purchaseQty}  = sale_data;
            if (purchaseQty > qty) {
                throw new HttpException(`insufficient Qty for  ${productId} pls input less qty value`, HttpStatus.BAD_REQUEST);
            }
            return await this.salesService.addRecord(sale_data);
        } catch (error) {
            return error;
        
        }
    }
       
    @Post('/create')
    async createSale(@Body() data: CreateSaleDto) {
        try {
            return  await this.salesService.createSale(data);
        } catch (error) {
           
             if (error instanceof InternalServerErrorException) {
                return error;
             }
             else{
                return error
             }
        }
    }

    //All daily sales
        @Get()
        fetchSales(@Query('startDate') startDate?: Date, @Query('endDate') endDate?: Date) {
            try {
                return this.salesService.sales(startDate, endDate);
            }
            catch (error) {
              return { error , success: false }
            }
        }
    //monthly sales per product per day
    @Get('/monthly')
    async getMonthProductSales() {
        try {
            return await this.salesService.monthlyProductSales();
        } catch (error) {
            return error;
        }
    }
    //
    @Get('/product/records')
    async getProductRecords(@Query('productName') productName: string, @Query('date') date: Date,) {
        const result = await this.salesService.test(productName, date);
        return result;
    }

    @Get('/invoices')
    async fetchInvoiceData() {
        try {
            const invoices = await this.salesService.invoiceData();
            return invoices;
        } catch (error) {
            return error
        }
    }
    @Get('/invoiceDetails')
    async fetchInvoiceDetails(@Query('invoiceId') invoiceId: string) {
        try {
            const result = await this.salesService.invoiceDetails(invoiceId);
          
            return result;
        } catch (error) {
            return error
        }
    }
}