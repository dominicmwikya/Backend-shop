import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Entities/Product.entity";
import { Purchases } from "src/Entities/Purchases.Entity";
import { UserEntity } from "src/Entities/User.entity";
import { Between, EntityManager, ILike, QueryRunner, Repository } from "typeorm";
import { BatchService } from "../Batchs/BatchService";
import { UpdatePurchaseDto } from '../../Dtos/UpdatePurchaseDto';
import { purchasedto } from "../../Dtos/purchase";
import { UsersService } from "../Users/UserService";
import { Result } from "../category/Response/Result";
import { BatchEntity } from "../../Entities/BatchEntity";
import { format } from 'date-fns';
import { Transactions } from "src/helpers/Transactions";
@Injectable()
export class PurchaseService  {
	private queryRunner: QueryRunner;

	constructor(
		@InjectRepository(Purchases)
		private purchaseRepository: Repository<Purchases>,
		private batchService: BatchService,
		private userService: UsersService,
		private readonly entityManager: EntityManager,
		@InjectRepository(BatchEntity) private batchRepository: Repository<BatchEntity>,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
		private readonly transactions : Transactions
	) {
		this.queryRunner = this.entityManager.connection.createQueryRunner();
	}

	private modelCleanUp(model: string): string {
		return model.replace(/\s+/g, '');
	}
	async addPurchaseRecord(data: purchasedto) {
		try {
		   await this.transactions.connectAndStartTransaction(this.queryRunner);
			const { userId, productId, quantity, sprice, price, model } = data;
			const productExistsResult = await this.productRepository.findOne({ where: { id: productId } });

			if (!productExistsResult) {
				throw new NotFoundException(` Invalid product id ${productId} Not Found`);
			}
			const userExists = await this.userService.findUser(userId);
			if (!userExists) {
				throw new NotFoundException(`User id ${userId} is invalid`);
			}
			const cleanedModel = this.modelCleanUp(model);
			const generatedBatchNumber = await this.batchService.generateBatchNumber(cleanedModel);

			if (!generatedBatchNumber) {
				throw new InternalServerErrorException(`Error occured while generating purchase batch Number! Try again`);
			}

			const priceToString = Number.parseInt(price.toString());
			const quantityToString = Number.parseInt(quantity.toString());
			const purchaseTotal = priceToString * quantityToString;

			const purchaseObj = this.purchaseRepository.create({
				batchcode: generatedBatchNumber,
				product: productExistsResult,
				user: userExists,
				model: cleanedModel
			});

			const newPurchase = await this.purchaseRepository.save(purchaseObj);

			const batchObj = this.batchRepository.create({
				purchase_Price: price,
				purchase_Qty: quantity,
				sale_Price: sprice,
				purchase_Total: purchaseTotal,
				purchase: newPurchase,
				batchNumber: generatedBatchNumber,

			});
			await this.batchRepository.save(batchObj);

			newPurchase.batchId = batchObj.id;
			await this.purchaseRepository.save(newPurchase);

			productExistsResult.qty += quantityToString;

			await this.productRepository.save(productExistsResult);
			await this.transactions.commitTransaction(this.queryRunner);
			return this.createResult(true, `Purchase Record has beed Created!`);

		} catch (error) {
			await this.transactions.rollbackTransaction(this.queryRunner);
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
				const stock = Number(purchase.batch.purchase_Qty) - Number(purchase.soldQty);
				return {
					id: purchase.id,
					name: purchase.product.name,
					batchNumber: purchase.batchcode,
					stock: stock,
					sellingPrice: purchase.batch.sale_Price,
					buyPrice: purchase.batch.purchase_Price,
					user: purchase.user,
					product: purchase.product,
					purchaseId: purchase.id,
					batchId: purchase.batchId,
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
				{ product: { name: ILike(`%${searchValue}%`) } }
			],
			relations: ['product', 'batch'],
		});
		return response;
	}


	private calculateItemBalance(purchaseQty: number, soldQty: number) {
		return (purchaseQty - soldQty);
	}
	async getPurchases() {
		try {
			const purchases = await this.purchaseRepository
				.createQueryBuilder('purchase')
				.select([
					'purchase.id',
					'purchase.model',
					'purchase.soldQty',
					'purchase.batchcode',
					'purchase.status',
					'purchase.createdAt'
				])
				.leftJoinAndSelect('purchase.product', 'product')
				.leftJoinAndSelect('purchase.batch', 'batch')
				.leftJoinAndSelect('purchase.user', 'user')
				.where('purchase.flag = :flag', { flag: 0 })
				.getMany();

			const records = purchases.map(item => ({
				id: item.id,
				batchcode: item.batchcode,
				product: item.product?.name,
				productId: item.product?.id,
				productQty: item.batch?.purchase_Qty,
				quantity: item.batch?.purchase_Qty,
				total: item.batch?.purchase_Total,
				availableQty: this.calculateItemBalance(item.batch.purchase_Qty, item.soldQty),
				salePrice: item.batch?.sale_Price,
				dateCreated: item.createdAt,
				username: item.user?.username,
			}));

			const formatedRecords = records.map(record => ({
				...record,
				dateCreated: format(new Date(record.dateCreated), 'dd/MM/yyyy')
			}));

			return new Result(true, 'Purchases Data: ', formatedRecords);
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
			const purchase = await this.getPurchase(id);

			if (!purchase) {
				return this.createResult(false, `Purchase record with id ${id} not found`);
			}

			const { quantity, sprice } = updateData;

			if (this.isValidUpdateData(updateData)) {

				const updateResult = await this.batchRepository.update(
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
			const purchaseExist = await this.getPurchase(id);

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
			return this.createResult(false, `Failed to delete record ${id}`);
		} catch (error) {
			return this.createResult(false, `Error occured while deleting  id ${id}: ${error.message}`);
		}
	}

	async getPurchase(id: number) {
		try {
			return await this.purchaseRepository.findOne({ where: { id: id }, relations: ['product'] });
		} catch (error) {
			return error;
		}
	}

	async findByCode(code: string) {
		return await this.purchaseRepository.findOne({ where: { batchcode: code } });
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

	async getfilteredPurchasesWithBatches() {
		try {
			const response = await this.purchaseRepository
				.createQueryBuilder('purchases')
				.select([
					'purchases.id',
					'purchases.soldQty',
					'purchases.createdAt',
					'purchases.status',
					'purchases.flag',
					'purchases.batchcode',
					'purchases.batchId',
					'purchases.productId',
					'purchases.userId'
				])
				.leftJoinAndSelect('purchases.product', 'product')
				.leftJoinAndSelect('purchases.batch', 'batch')
				.where('purchases.soldQty < batch.purchase_Qty')
				.andWhere('purchases.soldQty > 0')
				.andWhere('purchases.flag = 0')
				.orderBy('purchases.soldQty', 'DESC')
				.take(5)
				.getMany();

			const result = response.map((item) => {
				const stock = Number(item.batch?.purchase_Qty) - Number(item.soldQty);
				return {
					id: item.id,
					name: item.product?.name,
					batchNumber: item.batchcode,
					stock: stock,
					soldQty: item.soldQty,
					sellingPrice: item.batch?.sale_Price,
					buyPrice: item.batch?.purchase_Price,
					user: item.user,
					product: item.product
				}
			});
			return result;
		} catch (error) {
			return error;
		}
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
			return new Result(true, ``, result)
		} catch (error) {
			return new Result(false, error.message);
		}
	}
}