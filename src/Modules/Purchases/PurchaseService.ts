import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Modules/Products/entities/Product.entity";
import { Purchases } from "src/Modules/Purchases/entities/Purchases.Entity";
import { UserEntity } from "src/Modules/Users/entities/User.entity";
import { EntityManager, ILike, Repository } from "typeorm";
import { BatchService } from "../Batchs/BatchService";
import { UpdatePurchaseDto } from './dtos/UpdatePurchaseDto';
import { purchasedto } from "./dtos/purchase";
import { PurchaseDto } from "./dtos/purchaseDto";
import { UsersService } from "../Users/UserService";
@Injectable()
export class PurchaseService {
	constructor(@InjectRepository(Purchases)
	    private purchaseRepository: Repository<Purchases>,
		private batchService: BatchService,
		// private userservice: UsersService,
		@InjectRepository(Product) private productRepository: Repository<Product>,
		@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
		
	) { }

	async addRecord(body: purchasedto[]) {
		const purchaseData = body;
		const savedPurchases: Purchases[] = [];

		try {
			for (const purchase of purchaseData) {
				const p_id = purchase.productId;
				const product = await this.productRepository.findOne( { where :{id :p_id}});
				if (!product) {
					throw new NotFoundException(`Product id ${purchase.productId} Not found`);
				}
				const user_id = purchase.userId
				const user = await this.userRepository.findOne({where :{id : user_id}});

				const dataDto: PurchaseDto = {
					price: purchase.price,
					quantity: purchase.quantity,
					sprice: purchase.sprice
				};
				const batchNumber = await this.batchService.generateBatchNumber();
				const addresult =  this.purchaseRepository.create({
					product,
					// user_,
					batchcode: batchNumber,
					purchase_Price: dataDto.price,
					purchase_Qty: dataDto.quantity,
					sale_Price: dataDto.sprice,
					purchase_Total: Number.parseInt(dataDto.price.toString()) *
						Number.parseInt(dataDto.quantity.toString()),
				});
				const response : Purchases  = await this.purchaseRepository.save(addresult);
				product.qty += Number.parseInt(dataDto.quantity.toString());
		       
				await this.productRepository.save(product);
				savedPurchases.push(response);
			}
			return  savedPurchases;
		
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			else{
				throw new InternalServerErrorException(`An error occured while creating purchase record. ${error.message}`)
			}
		}

	}

	async filterByBatch(searchParam: string) {
		try {
			const response = await this.fetchFilterData(searchParam);

			if (response.length === 0) {
				throw new NotFoundException(`No matching item Found` )
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
				else{
					throw new InternalServerErrorException(`Error searching data : ${error.message}`);
				}
		}
	}
//search param : product name or batch number
	private async fetchFilterData(searchParam: string): Promise<Purchases[]> {
		const searchValue = searchParam.trim();
		const response = await this.purchaseRepository.find({
			where: [
				{ batchcode: ILike(`%${searchValue}%`)},
				{product : {name :ILike(`%${searchParam}%`)}}
			],
			relations: ['product']
		});
		return response;
	}
	

	// async CreatePurchase(product: Product, user: UserEntity, price: number, quantity: number, sprice: number,) {
	// 	const batchNumber = await this.batchService.generateBatchNumber();
	// 	const newPurchase = this.purchaseRepository.create({
	// 		product,
	// 		user,
	// 		batchcode: batchNumber,
	// 		purchase_Price: price,
	// 		purchase_Qty: quantity,
	// 		sale_Price: sprice,
	// 		purchase_Total: Number.parseInt(price.toString()) *
	// 			Number.parseInt(quantity.toString()),
	// 	});
	// 	try {
	// 		const savedPurchase = await this.purchaseRepository.save(newPurchase);
	// 		product.qty += Number.parseInt(quantity.toString());
	// 		await this.productRepository.save(product);
	// 		return savedPurchase;
	// 	} catch (error) {
	// 		throw error;
	// 	}
	// }

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
				.leftJoin('purchase.user', 'user') // Join the 'user' relation
				.leftJoin('purchase.product', 'product') // Join the 'product' relation
				.getMany();

			return purchases;
		} catch (error) {
			throw new HttpException({ error: `${error} error occured while fetching purchases` },
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async updatePurchase1(pId: number, soldQty: any) {
		try {
			const purchase = await this.findOne(pId);

			if (!purchase) {
				throw new HttpException(`Purchase with ID ${pId} not found`, HttpStatus.NOT_FOUND);
			}

			const result = await this.purchaseRepository.update(
				{ id: pId },
				{ soldQty: soldQty }
			);

			if (result.affected === 1) {
				return 1;
			} else {
				throw new HttpException('Error updating purchase', HttpStatus.INTERNAL_SERVER_ERROR);
			}
		} catch (error) {
			if (error instanceof HttpException) {
				return { error: `${error}` }
			} else {
				throw new HttpException('An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

	async updatePurchaseQuantity(entityManager: EntityManager, id: number, soldQty: any) {
	    try {
			  await entityManager.update(Purchases, { batchcode: id }, { soldQty: soldQty });
		} catch (error) {
			throw new InternalServerErrorException(`Failed to update purchase quantity: ${error.message}`)
		}
	}

	async updatePurchase(id: number, updateData: UpdatePurchaseDto) {
		try {
			const purchase = await this.findOne(id);

			if (!purchase) {
				throw new HttpException(`Purchase record with id ${id} not found`, HttpStatus.NOT_FOUND);
			}

			const { quantity, price, sprice } = updateData;

			if (price !== undefined && quantity !== undefined && sprice !== undefined) {
				const updatedTotalQty = Number(quantity) * Number(price);

				const updateResult = await this.purchaseRepository.update(
					{ id: purchase.id },
					{
						purchase_Price: price,
						sale_Price: sprice,
						purchase_Total: updatedTotalQty
					});

				if (updateResult.affected === 1) {
					return { message: `Purchase record with id ${id} updated successfully` };
				} else {
					return { error: `Failed to update purchase record with id ${id}. Please try again.` };
				}
			} else {
				return { error: 'Invalid update data. Please provide valid values for price, quantity, and sell price.' };
			}
		} catch (error) {
			throw new HttpException(`An unexpected error occurred: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async testDeletePurchase(id: any) {
		const purchase = await this.purchaseRepository.findOne({ where: { id: id, flag: 0 }, relations: ['product'] });
		const product = purchase.product;
		product.qty -= purchase.purchase_Qty;
		const updateProductQty = await this.productRepository.update({ id: product.id }, { qty: product.qty });
		if (updateProductQty.affected === 1) {
			const updatePurchaseFlag = await this.deletePurchase(id);
			if (updatePurchaseFlag.message) {
				return { message: updatePurchaseFlag.message }
			}
			if (updatePurchaseFlag.error) {
				return { error: updatePurchaseFlag.error }
			}
		}
		else {
			return { error: `Error Occured while update product qty of ${id} Try again` }
		}
	}
	async deletePurchase(id: number): Promise<any> {
		try {
			const update = await this.findOne(id);
			if (update instanceof HttpException) {
				return { error: update }
			}
			const response = await this.purchaseRepository.update({ id: update.id }, { flag: 1 });
			if (response.affected === 1) {
				return { message: `Record ${id} deleted successfully` };
			}
			else {
				return { error: `Failed to delete record ${id}` };
			}
		} catch (error) {
			return { error: `Error occured while deleting  id ${id}: ${error.message}` };
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
	async findOne(id: number) {
		try {
			return await this.purchaseRepository.findOne({ where: { id: id }, relations: ['product'] });
		
		} catch (error) {
			throw new InternalServerErrorException(`Error! ${error.message}`);
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


}