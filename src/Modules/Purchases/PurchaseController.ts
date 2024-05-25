
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards, Query } from '@nestjs/common';
import { PurchaseService } from './PurchaseService';
import { UpdatePurchaseDto } from './dtos/UpdatePurchaseDto';
import { purchasedto } from './dtos/purchase';
import { AuthGuard } from '../Auth/authGuard';
import { Roles } from '../Auth/role.decorator';
import { Role } from '../Auth/role.enum';

@Controller('purchases')
@UseGuards(AuthGuard)
@Roles(Role.Admin, Role.saleAgent, Role.User)
export class PurchaseController {
	constructor(
		private purchaseService: PurchaseService,

	) { }

	@Get('/report')
    async generateReport(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
       try {
		let result = await this.purchaseService.generateReport(startDate, endDate);
		console.log("purchases", result)
		
		return result;
	   } catch (error) {
		console.log(error)
		return error
	   }
    }

	@Get()
	async getPurchases() {
		try {
			return await this.purchaseService.getPurchases();
		
		} catch (error) {
			return error
		}
	}

	@Get('/fastsales')
	async getFastSales() {
		try {
			const result = await this.purchaseService.fetchFastSellingBatches();
			return result;
		} catch (error) {

			return error
		}
	}
	@Post('create')
	async createPurchase(@Body() body: purchasedto[]) {
	try {
		return await this.purchaseService.addRecord(body);
	} catch (error) {
	    return error;
	}
	}
	@Put('/update/:id')
	async updatePurchase(@Param('id') id: number, @Body() data: UpdatePurchaseDto) {
		try {
			return await this.purchaseService.updatePurchase(id, data);
		} catch (error) {
			 return error;
		}
	}
	@Delete('/delete/:id')
	async deletePurchase(@Param('id') id: number) {
		try {
			const result = await this.purchaseService.deletePurchase(id);
			return result;
		} catch (error) {
			return error;
		}
	}

	@Put('/delete-multiple')
	async deleteMultiplePurchases(@Body() body: { ids: number[] | number }) {
		try {
			let response = [];
			let errorIds = [];
			let purchaseIds = Array.isArray(body.ids) ? body.ids : [body.ids];
			await Promise.all(
				purchaseIds.map(async id => {
					const result = await this.purchaseService.testDeletePurchase(id);
					response.push(result);
					if (result.error) {
						errorIds.push(id); // Track the IDs where errors occurred
					}
					return result;
				}));

			if (errorIds.length > 0) {
				return { error: 'Deletion failed for IDs: ' + errorIds.join(', ') };
			} else {
				return { message: 'All deletions were successful.' };
			}
		} catch (error) {
			return {
				error: error
			}
		}
	}

	@Get('/search/:searchParam')
	async findProductByName(@Param('searchParam') searchParam: any) {
		return await this.purchaseService.filterByBatch(searchParam);
	}

	@Get('/:id')
	async findById(@Param('id') purchaseId: number) {
		return await this.purchaseService.findOne(purchaseId)
	}
}
