import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateSaleDto } from '../../Dtos/CreateSaleDTO';
import { SaleService } from './SalesService';
import { PostSaleDto } from '../../Dtos/PostSaleDto';
import { Result } from '../category/Response/Result';
import { UserLog } from 'src/Entities/Userlogs';
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
    private JSONResult(success: boolean, message: string, data?: any) {
        return new Result(success, message, data);
    }
    private validateSaleInput(data: PostSaleDto) {
        const { price, purchaseId, userId, purchaseQty, productId, total } = data;

        try {
            if (purchaseId <= 0) {
                return `Invalid purchaseId  ${purchaseId} value`;
            }
            if (!purchaseQty || purchaseQty <= 0) {
                return `Invalid qty  ${purchaseQty} value`;
            }
            if (price <= 0) {
                return `invalid price value ${price}`
            }
            if (total <= 0) {
                return `invalid price value ${total}`
            }
            if (productId <= 0) {
                return `invalid price value ${productId}`
            }
            if (userId <= 0) {
                return `invalid price value ${userId}`
            }
            return null
        } catch (error) {
            return error;
        }
    }
    
    @Post('/purchase-sale')
    async addRecord(@Body() saleData: PostSaleDto) {
        try {
            const validationResult = this.validateSaleInput(saleData);
            if (validationResult) {
                return this.JSONResult(false, validationResult);
            }
            return await this.salesService.addRecord(saleData);
        } catch (error) {
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
            return error;
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
            return error;
        }
    }
    //All daily sales
    @Get()
    async fetchSales(@Query('startDate') startDate?: Date, @Query('endDate') endDate?: Date) {
        try {
            return await this.salesService.sales(startDate, endDate);
        }
        catch (error) {
            return error
        }
    }

    @Get('/product/records')
    async getProductRecords(@Query('id') id: number) {
        try {
            return await this.salesService.getProductRecord(id);
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
           return  await this.salesService.generateReport(startDate, endDate);

        } catch (error) {
           return error;
        }
    }

}