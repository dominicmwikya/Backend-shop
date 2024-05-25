import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Post, Query, Res } from '@nestjs/common';
import { CreateSaleDto } from './dtos/CreateSaleDTO';
import { SaleService } from './SalesService';
import { PostSaleDto } from './dtos/PostSaleDto';
import { query } from 'express';
import { Result } from '../category/Response/Result';
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
                throw new BadRequestException(`insufficient Qty for  ${productId} pls input less qty value`);
            }
            return await this.salesService.addRecord(sale_data);
        } catch (error) {
            if (error instanceof BadRequestException) {
                return new Result(false, `Error: ${error.message}`);
            }
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
         async fetchSales(@Query('startDate') startDate?: Date, @Query('endDate') endDate?: Date) {
            try {
                let sales =  await this.salesService.sales(startDate, endDate);
                return new Result(true, 'Sales Records', sales);
            }
            catch (error) {
              return new Result(false, `Error fetching daily sales ${error}`);
            }
        }

    @Get('/product/records')
    async getProductRecords(@Query('id') id: number) {
       try {
         return  await this.salesService.test(id);
      
       } catch (error) {
          return error;
       }
    }

    @Get('/product/summary') 
    async GetproductSummary() {
        try {
            return await this.salesService.GetProductSummaryData();
        } catch (error) {
            return error;
        }
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
    @Get('/report')
    async generateReport(@Query('startDate') startDate?: Date, @Query('endDate') endDate?: Date) {
        try {
            const result =  await this.salesService.generateReport(startDate, endDate);
            console.log(result);
            const jsonData = JSON.stringify(result);
            return jsonData;
        } catch (error) {
            return { error , success: false }
        }
    }
}