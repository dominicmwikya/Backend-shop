import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Post, Query, Res, UsePipes } from '@nestjs/common';
import { CreateSaleDto } from './dtos/CreateSaleDTO';
import { SaleService } from './SalesService';
import { PostSaleDto } from './dtos/PostSaleDto';
import { query } from 'express';
import { Result } from '../category/Response/Result';
import { Validate } from 'class-validator';
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
    async addRecord(@Body() saleData: PostSaleDto) {
        try {
            return await this.salesService.addRecord(saleData);
        } catch (error) {
            if (error instanceof BadRequestException) {
                return new Result(false, `Error: ${error.message}`);
            }
            return error;
        }
    }

    private validateSaleInputData(data: CreateSaleDto) {
        try {
            const { cart_items, customer_name, grantTotal, totalItems, balance, amount } = data;

            if (grantTotal <= 0) {
                return { error: 'Invalid grantTotal' };
            }

            if (amount <= 0) {
                return { error: 'Invalid amount' };
            }

            if (balance < 0) {
                return { error: `Balance must not be >= 0` };
            }

            if (totalItems <= 0) {
                return { error: 'Total Items must >= 1' }
            }
            for (const item of cart_items) {
                if (item.quantity <= 0) {
                    return { error: `Invalid quantity for product ID ${item.productId}` };
                }
                if (item.price <= 0) {
                    return { error: `Invalid price for product ID ${item.productId}` };
                }
                if (item.total !== item.price * item.quantity) {
                    return { error: `Total does not match price * quantity for product ID ${item.productId}` };
                }
                if (!customer_name) {
                    return { error: 'Customer name is required!!' };
                }

                if (balance < 0) {
                    return { error: `Balance must not be >= 0` };
                }
                return null;
            }
        } catch (error) {
            if (error || error instanceof BadRequestException) {
                return error;
            }
        }
    }

    @Post('/create')
    async createSale(@Body() data: CreateSaleDto) {
        try {
            const validateInput = this.validateSaleInputData(data);

            if (validateInput) {
                return new Result(false, validateInput.error);
            }
            return await this.salesService.createSale(data);
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                return error;
            }
            else {
                return error
            }
        }
    }
    //All daily sales
    @Get()
    async fetchSales(@Query('startDate') startDate?: Date, @Query('endDate') endDate?: Date) {
        try {
            let sales = await this.salesService.sales(startDate, endDate);
            console.log("sales result", sales)
            return sales;
        }
        catch (error) {
            return error
        }
    }

    @Get('/product/records')
    async getProductRecords(@Query('id') id: number) {
        try {
            return await this.salesService.test(id);
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
            const result = await this.salesService.generateReport(startDate, endDate);
            console.log(result);
            const jsonData = JSON.stringify(result);
            return jsonData;
        } catch (error) {
            return { error, success: false }
        }
    }
}