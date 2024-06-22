
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { PurchaseService } from './PurchaseService';
import { UpdatePurchaseDto } from './dtos/UpdatePurchaseDto';
import { purchasedto } from './dtos/purchase';
import { AuthGuard } from '../Auth/authGuard';
import { Roles } from '../Auth/role.decorator';
import { Role } from '../Auth/role.enum';
import { Result } from '../category/Response/Result';

@Controller('purchases')
@UseGuards(AuthGuard)
@Roles(Role.Admin, Role.saleAgent, Role.User)

export class PurchaseController {

	constructor(private purchaseService: PurchaseService) {}

	private validatePurchaseData(data: purchasedto) {
		const errors = [];
        const {price, sprice, quantity,productId, userId} = data;

		if (!price || !sprice || !quantity || !productId || !userId) {
			errors.push(`Missing data value! Ensure all data is provided and correct`)
			return { error : `Missing data value! Ensure all data is provided and correct`};
		}
		const priceNum = Number(price);
		const spriceNum = Number(sprice);
		const quantityNum = Number(quantity);
		if (isNaN(spriceNum) || isNaN(priceNum) || isNaN(quantityNum)) {
			errors.push(`Invalid Data type provided`)
			return {error : `Invalid Data type provided`};
		}
		
		if ( priceNum <=0 || spriceNum <= 0 || quantityNum <= 0) {
			errors.push(`Value ${price} or ${sprice} or ${quantity} can not less 0 or less!`)
			return {error : `Value ${price} or ${sprice} or ${quantity} can not less 0 or less!`};
		}
		
		if (spriceNum < priceNum) {
			errors.push(`invalid selling price!. Sell price cannot be less than buying price`)
			return {error : ` invalid selling price!. Sell price cannot be less than buying price`};
		}
		return {
			error: errors.length > 0 ? errors : null,
		};
 	}

	private CreateResult (success : boolean, message: any, data?: any) : Result {
		return new Result(success, message, data);
	}

	@Post('/create')
	@UsePipes(new ValidationPipe({ transform : true}))
	async addPurchase(@Body() data : purchasedto){
		try {
			const validationResult = this.validatePurchaseData(data);

			if (validationResult.error) {
			    return this.CreateResult(false, validationResult.error);
			}
			 return await this.purchaseService.addPurchaseRecord(data);
		} catch (error) {
			console.error('Error:', error);
			return error;
		}
	}

	@Get('/report')
	async generateReport(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
		try {
			return await this.purchaseService.generateReport(startDate, endDate);
		} catch (error) {
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

	@Put('/update/:id')
	async updatePurchase(@Param('id') id: number, @Body() data: UpdatePurchaseDto) {
		try {
			console.log("id", id)
			console.log("data", data)
			const result = await this.purchaseService.updatePurchase(id, data);
			return result;
		} catch (error) {
			return error;
		}
	}

	@Delete('/delete/:id')
	async deletePurchase(@Param('id') id: number) {
		try {
			return await this.purchaseService.deletePurchase(id);
		} catch (error) {
			return error;
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
