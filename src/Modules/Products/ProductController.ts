
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Product } from 'src/Modules/Products/entities/Product.entity';
import { AuthGuard } from '../Auth/authGuard';
import { Roles } from '../Auth/role.decorator';
import { ProductService } from './ProductService';
import { createProductDTO } from './dtos/createProductDTO';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../Auth/role.enum';

@ApiBearerAuth()
@Controller('products')
export class ProductController {
	constructor(private productService: ProductService) { }

	@UseGuards(AuthGuard)
	@Get('/')
	@Roles(Role.Admin)
	async getProducts() {
		try {
			return await this.productService.findAll();
		} catch (error) {
			throw error;
		}
	}

	@UseGuards(AuthGuard)
	@Post('/create')
	@Roles(Role.Admin)
	async create(@Body() product: createProductDTO) {
		try {
			return await this.productService.createProduct(product);
		} catch (error) {
			throw error;
		}
	}

	@Delete('/remove')
	@Roles(Role.Admin)
	async productDelete(@Body() body: { ids: number[] | number }) {
		try {
			const idBody = body.ids;
			const idArray = Array.isArray(idBody) ? idBody : [idBody];
			const result = await Promise.all(
				idArray.map(async id => {
					return await this.productService.deleteProduct(id);
				})
			);
			const isSuccess = result.every(result => typeof result === "boolean" && result === true);
			if (isSuccess) {
				return {
					message: " products deleted successfully"
				};
			}
			else {
				return {
					error: "Some products could not be deleted"
				};
			}
		} catch (error) {
			return {
				error: error
			}
		}
	}


	@Put('/:id')
	@Roles(Role.Admin)
	async updateProduct(@Param('id') id: number, @Body() data: Product) {
		try {
			await this.productService.updateProduct(id, data);
			return {
				message: ` producted id ${id} Updated successfuly`
			}
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new HttpException({ error: `${error} Error occured while updating qty` },
					HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}
}
