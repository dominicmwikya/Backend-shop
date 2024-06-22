import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Modules/Products/entities/Product.entity";
import { Between, EntityManager, Repository } from "typeorm";
import { PurchaseService } from "../Purchases/PurchaseService";
import { createProductDTO } from "./dtos/createProductDTO";
@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
		private readonly purchaseService: PurchaseService,
	) { }

	async findAll(): Promise<Product[]> {
		try {
			const products: Product[] = await this.productRepository.find({ where: { flag: 0 } });
			if (products.length === 0) {
				throw new NotFoundException('Product table is EMPTY. PLS ADD PRODUCTS')
			}
			return products;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new InternalServerErrorException(error.message);
		}
	}

	async createProduct(data: createProductDTO) {
		try {
			const exists_product = await this.productRepository.findOne({ where: { name: data.name, flag: 0 } });
			if (!exists_product) {
				const newProduct = this.productRepository.create(data);
				await this.productRepository.save(newProduct);
				return { message: `Product ${name} Created successfully` };
			}
			throw new ConflictException(`Product ${data.name} already exists! Choose a different name `);
		} catch (error) {
			if (error instanceof ConflictException) {
				throw error;
			}
			throw new InternalServerErrorException(`Error occured while adding product! - ${error.message}`);
		}
	}

	async updateProductQuantity(entityManager: EntityManager, productId: number, purchase_qty: number) {
		try {
			const product = await this.productById(productId);
			if (!product) {
				throw new NotFoundException(`Product ${productId} not found`);
			}

			return await entityManager.update(Product, { id: productId }, { qty: purchase_qty },);
		} catch (error) {
			return error;
		}
	}

	async updateProduct(id: number, data: any) {
		const product = await this.productRepository.findOne({ where: { id: id } });
		if (!product) {
			throw new NotFoundException(`product ${id} does not exist in the database`)
		}
		try {
			await this.productRepository.update({ id }, data);
			return { message: `Product ${id} updated successfully` }
		} catch (error) {
			if (error instanceof NotFoundException) {
				return error;
			}
			throw new InternalServerErrorException(`${error} Error occured while Updating product! Try again`);
		}
	}

	async deleteProduct(id: number): Promise<boolean | {}> {
		try {
			const product = await this.findOne(id);
			if (!product) {
				throw new NotFoundException(`Product ${id} not found`);
			}

			const result = await this.productRepository.update({ id: product.id }, { flag: 1 });

			if (result.affected !== 0) {
				const deleteAssociatedPurchases = await this.purchaseService.deletePurchaseByProductId(product.id);
				if (deleteAssociatedPurchases) {
					return true;
				}
				else {
					throw new InternalServerErrorException(`Error deleting purchases with id ${id}`);
				}

			} else {
				throw new InternalServerErrorException(`Error deleting product with id ${id}`);
			}

		} catch (error: any) {
			throw new InternalServerErrorException(`Failed to update product: ${error.message}`);
		}
	}

	 async productExists(id:number) {
		return await this.productRepository.findOne({ where:{id: id}});
	}
	async productById(id: number) {
		const product = await this.productRepository.findOne({ where: { id: id } });
		if (!product) {
			throw new NotFoundException(`Product ${id} not found`);
		}
		return product;
	}

	private async findOne(id: number) {
		const product = await this.productRepository.findOne({
			where: { id: id, flag: 0 },
			relations: ['purchases', 'sales', 'users']
		});

		if (!product) {
			throw new NotFoundException(`Product ${id} not found`);
		}
		return product;
	}
	async generateReport(startDate?: Date, endDate?: Date): Promise<Product[] | { error: string }> {
		try {
			const queryConditions: any = {};

			if (startDate && endDate) {
				queryConditions.sell_date = Between(startDate, endDate);
			}

			const product = await this.productRepository.find({
				relations: ['purchases'],
				where: queryConditions
			});
			return product;
		} catch (error) {
			return error;
		}
	}
}
