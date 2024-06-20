import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Modules/Products/entities/Product.entity";
import { Purchases } from "src/Modules/Purchases/entities/Purchases.Entity";
import { UserEntity } from "src/Modules/Users/entities/User.entity";
import { Between, EntityManager, ILike, Repository } from "typeorm";
import { BatchService } from "../Batchs/BatchService";
import { UpdatePurchaseDto } from './dtos/UpdatePurchaseDto';
import { purchasedto } from "./dtos/purchase";
import { PurchaseDto } from "./dtos/purchaseDto";
import { UsersService } from "../Users/UserService";
import { Result } from "../category/Response/Result";
@Injectable()
export class PurchaseService {
	constructor(@InjectRepository(Purchases)
	private purchaseRepository: Repository<Purchases>,
		private batchService: BatchService,
		private readonly entityManager: EntityManager,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,

	) { }

	async addRecord(body: purchasedto[]) {
		try {
			const queryRunner = this.entityManager.connection.createQueryRunner();
			await queryRunner.connect();
			await queryRunner.startTransaction();
			const entityManager = queryRunner.manager;
			const purchaseData = body;
			const savedPurchases: Purchases[] = [];

			for (const purchase of purchaseData) {
				const p_id = purchase.productId;
				const product = await this.productRepository.findOne({ where: { id: p_id } });
				if (!product) {
					throw new NotFoundException(`Product id ${purchase.productId} Not found`);
				}
				const user_id = purchase.userId
				// const user = await this.userRepository.findOne({where :{id : user_id}});

				const dataDto: PurchaseDto = {
					price: purchase.price,
					quantity: purchase.quantity,
					sprice: purchase.sprice
				};
				const batchNumber = await this.batchService.generateBatchNumber();
				const addresult = this.purchaseRepository.create({
					product,
					batchcode: batchNumber,
					purchase_Price: dataDto.price,
					purchase_Qty: dataDto.quantity,
					sale_Price: dataDto.sprice,
					purchase_Total: Number.parseInt(dataDto.price.toString()) *
						Number.parseInt(dataDto.quantity.toString()),
				});

				const response: Purchases = await this.purchaseRepository.save(addresult);
				product.qty += Number.parseInt(dataDto.quantity.toString());

				await this.productRepository.save(product);
				await queryRunner.commitTransaction();
				savedPurchases.push(response);
			}
			return savedPurchases;

		} catch (error) {
			if (error instanceof NotFoundException) {
				return new Result(false, `Error : ${error.message}`)
			}
			else {
				return new Result(false, `Error : ${error.message}`)
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

			const records = purchases.map((purchase) => ({
				id: purchase.id,
				batchcode: purchase.batchcode,
				product: purchase.product.name,
				productId: purchase.product.id,
				purchaseId: purchase.id,
				productQty: purchase.product.qty,
				quantity: purchase.purchase_Qty,
				total: purchase.purchase_Total,
				availableQty: (purchase.purchase_Qty - purchase.soldQty),
				salePrice: purchase.sale_Price,
				dateCreated: purchase.createdAt,
				userId: purchase.user
			}));
			return new Result(true, 'Purchases Data: ', records);
		} catch (error) {
			return this.createResult(false, `failed to fetch purchase data`);
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