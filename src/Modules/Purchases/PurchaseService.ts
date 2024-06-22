import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Modules/Products/entities/Product.entity";
import { Purchases } from "src/Modules/Purchases/entities/Purchases.Entity";
import { UserEntity } from "src/Modules/Users/entities/User.entity";
import { Between, EntityManager, ILike, QueryRunner, Repository } from "typeorm";
import { BatchService } from "../Batchs/BatchService";
import { UpdatePurchaseDto } from './dtos/UpdatePurchaseDto';
import { purchasedto } from "./dtos/purchase";
import { PurchaseDto } from "./dtos/purchaseDto";
import { UsersService } from "../Users/UserService";
import { Result } from "../category/Response/Result";
import { ProductService } from "../Products/ProductService";
@Injectable()
export class PurchaseService {
	private queryRunner: QueryRunner;
	constructor(@InjectRepository(Purchases)
		private purchaseRepository: Repository<Purchases>,
		private batchService: BatchService,
		private userService: UsersService,
		private readonly entityManager: EntityManager,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
	) { this.queryRunner= this.entityManager.connection.createQueryRunner(); }

	async addPurchaseRecord(data: purchasedto) {
		try {
			await this.queryRunner.connect();
			await this.queryRunner.startTransaction();
			const { userId, productId, quantity, sprice, price, supplierId} = data;
			const productExistsResult = await this.productRepository.findOne({ where :{ id : productId}});

			if (!productExistsResult) {
				throw new NotFoundException(` Invalid product id ${productId} Not Found`);
			}
			const userExists = await this.userService.findUserId(userId);
			if (!userExists) {
				throw new NotFoundException(`User id ${userId} is invalid`);
			}
			const generatedBatchNumber = await this.batchService.generateBatchNumber();
			if (!generatedBatchNumber) {
				throw new InternalServerErrorException(`Error occured while generating purchase batch Number! Try again`);
			}
			const priceToString =Number.parseInt(price.toString());
			const quantityToString = Number.parseInt(quantity.toString());
			const purchaseTotal = priceToString * quantityToString;

			const purchaseObj = this.purchaseRepository.create({
				batchcode : generatedBatchNumber,
				purchase_Price : price,
				purchase_Qty : quantity,
				sale_Price : sprice,
				purchase_Total : purchaseTotal,
				product: productExistsResult,
				user: userExists,
			});

			await this.purchaseRepository.save(purchaseObj);

			productExistsResult.qty += quantityToString;

			await this.productRepository.save(productExistsResult);
			await this.queryRunner.commitTransaction();
			return this.createResult(true, `Purchase Record has beed Created!`);

		} catch (error) {
			if (error || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
				return this.createResult(false, error.message);
			}
		}
	}

	async filterByBatch(searchParam: string) {
		try {
			const response = await this.fetchFilterData(searchParam);

			if (response.length === 0) {
				throw new NotFoundException(`No matching item Found`)
			}
			const mappedData = response.map((purchase) => {
				const stock = Number(purchase.purchase_Qty) - Number(purchase.soldQty);
				return {
					id: purchase.id,
					name: purchase.product.name,
					batchNumber: purchase.batchcode,
					stock: stock,
					sellingPrice: purchase.sale_Price,
					buyPrice: purchase.purchase_Price,
					user: purchase.user,
					product: purchase.product
				};
			});

			const filtered = mappedData.filter((item) => {
				return item.batchNumber.toLowerCase().includes(searchParam.toLowerCase()) ||
					item.name.toLowerCase().includes(searchParam.toLowerCase());
			})

			const filteredData = filtered.filter((item) => item.stock > 0);
			return filteredData;
		} catch (error) {
			if (error instanceof NotFoundException) {
				return error;
			}
			else {
				throw new InternalServerErrorException(`Error searching data : ${error.message}`);
			}
		}
	}
	//search param : product name or batch number
	private async fetchFilterData(searchParam: string): Promise<Purchases[]> {
		const searchValue = searchParam.trim();
		const response = await this.purchaseRepository.find({
			where: [
				{ batchcode: ILike(`%${searchValue}%`) },
				{ product: { name: ILike(`%${searchParam}%`) } }
			],
			relations: ['product']
		});
		return response;
	}

	async getPurchases() {
		try {
			const purchases = await this.purchaseRepository
				.createQueryBuilder('purchase')
				.select([
					'purchase.id',
					'purchase.purchase_Qty',
					'purchase.purchase_Price',
					'purchase.sale_Price',
					'purchase.purchase_Total',
					'purchase.soldQty',
					'purchase.status',
					'purchase.batchcode',
					'purchase.createdAt'])
				.addSelect(['user.id', 'user.username', 'user.email'])
				.addSelect(['product.id', 'product.category', 'product.name', 'product.min_qty', 'product.qty', 'product.sku'])
				.where('purchase.flag = :flag', { flag: 0 })
				.leftJoin('purchase.user', 'user')
				.leftJoin('purchase.product', 'product')
				.getMany();

			const records = purchases.map((item) => ({
				id: item.id,
				batchcode: item.batchcode,
				product: item.product?.name,
				productId: item.product?.id,
				productQty: item.product?.qty,
				quantity: item.purchase_Qty,
				total: item.purchase_Total,
				availableQty: (item.purchase_Qty - item.soldQty),
				salePrice: item.sale_Price,
				dateCreated: item.createdAt,
				userId: item.user
			}));
			return new Result(true, 'Purchases Data: ', records);
		} catch (error) {
			return this.createResult(false, `failed to fetch purchase data ${error.message}`);
		}
	}

	async updatePurchaseQuantity(entityManager: EntityManager, batchId: number, soldQty: any) {
		try {
			return await entityManager.update(
				Purchases,
				{ id: batchId },
				{ soldQty: soldQty }
			);
		} catch (error) {
			return error;
		}
	}

	async updatePurchase(id: number, updateData: UpdatePurchaseDto) {
		try {
			const purchase = await this.findOne(id);

			if (!purchase) {
				return this.createResult(false, `Purchase record with id ${id} not found`);
			}

			const { quantity, sprice } = updateData;

			if (this.isValidUpdateData(updateData)) {

				const updateResult = await this.purchaseRepository.update(
					{ id: purchase.id },
					{
						sale_Price: sprice,

						purchase_Qty: quantity
					});

				if (updateResult.affected === 1) {

					return this.createResult(true, `Purchase record with id ${id} updated successfully`);

				} else {

					return this.createResult(false, `Failed to update purchase record with id ${id}. Please try again.`);
				}
			}
			else {
				return this.createResult(false, `Invalid data. Please provide input values for price, quantity`);
			}

		} catch (error) {

			return this.createResult(false, `An unexpected error occurred: ${error.message}`);
		}
	}

	private isValidUpdateData(updateData: UpdatePurchaseDto): boolean {
		const { quantity, sprice } = updateData;

		if (quantity === undefined && sprice === undefined) {
			return false;
		}

		const QtyNum = Number(quantity);
		const priceNum = Number(sprice);

		if (isNaN(QtyNum) || isNaN(priceNum)) {
			return false
		}

		if (QtyNum <= 0 || priceNum <= 0) {
			return false;
		}

		return true;
	}

	private createResult(success: boolean, message: string): Result {
		return new Result(success, message);
	}

	async deletePurchase(id: number): Promise<any> {
		try {
			const purchaseExist = await this.findOne(id);

			if (!purchaseExist) {
				return this.createResult(false, `Purchase id ${id} doesnt exist in database`);
			}
			//soft delete purchase record by seting flag = 1;
			const updateResponse = await this.purchaseRepository.update(
				{ id: purchaseExist.id },
				{ flag: 1 }
			);

			if (updateResponse.affected === 1) {
				return this.createResult(true, `Record ${id} deleted successfully`);
			}
			else {
				return this.createResult(false, `Failed to delete record ${id}`);
			}
		} catch (error) {
			return this.createResult(false, `Error occured while deleting  id ${id}: ${error.message}`);
		}
	}

	async findOne(id: number): Promise<any> {
		try {
			return await this.purchaseRepository.findOne({ where: { id: id }, relations: ['product'] });
		} catch (error) {
			throw new InternalServerErrorException(`Error! ${error.message}`);
		}
	}

	async deletePurchaseByProductId(productId: number): Promise<boolean> {
		try {
			const purchases = await this.purchaseRepository.find({ where: { product: { id: productId } } });

			const updatePromises = purchases.map(async purchase => {
				await this.purchaseRepository.update({ id: purchase.id }, { flag: 1 });
			});
			await Promise.all(updatePromises);
			return true;
		} catch (error) {
			throw new Error(`Failed to update associated purchases: ${error.message}`);
		}
	}

	async fetchFastSellingBatches() {
		const response = await this.purchaseRepository
				.createQueryBuilder('fastsales')
				.leftJoinAndSelect('fastsales.product', 'product')
				.where('fastsales.soldQty < fastsales.purchase_Qty && fastsales.soldQty > 0')
				.andWhere('fastsales.flag = 0')
				.orderBy('fastsales.soldQty', 'DESC')
				.take(5)
				.getMany();

		const result = response.map((resp) => {
			const stock = Number(resp.purchase_Qty) - Number(resp.soldQty);
			return {
				id: resp.id,
				name: resp.product.name,
				batchNumber: resp.batchcode,
				stock: stock,
				soldQty: resp.soldQty,
				sellingPrice: resp.sale_Price,
				buyPrice: resp.purchase_Price,
				user: resp.user,
				product: resp.product
			}
		});
		return result;
	}

	async generateReport(startDate?: Date, endDate?: Date) {
		try {
			let purchases = [];

			const queryConditions: any = {};
			if (startDate && endDate) {
				queryConditions.createdAt = Between(startDate, endDate);
			}

			purchases = await this.purchaseRepository.find({
				relations: ['product'],
				where: queryConditions
			});

			const result = purchases.map((purchase) => ({
				id: purchase.id,
				product_Name: purchase.product.name,
				category: purchase.product.category,
				batch_Number: purchase.batchcode,
				purchase_Date: purchase.createdAt,
				quantity: purchase.purchase_Qty,
				buy_Price: purchase.purchase_Price,
				purchase_total_cost: purchase.purchase_Total,
				sell_Price: purchase.sale_Price,
				quantity_Sold: purchase.soldQty,
				available_Qty: purchase.product.qty,
			}));

			return result;
		} catch (error) {
			return error.message
		}
	}

}