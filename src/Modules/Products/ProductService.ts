import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Entities/Product.entity";
import { Between, EntityManager, Repository } from "typeorm";
import { PurchaseService } from "../Purchases/PurchaseService";
import { createProductDTO } from "../../Dtos/createProductDTO";
import { CategoryEntity } from "../../Entities/CategoryEntity";
import { Result } from "../category/Response/Result";
import { CategoryServiceService } from "../category/category-service/category-service.service";
import { UsersService } from "../Users/UserService";
@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
		private readonly purchaseService: PurchaseService,
		private catService: CategoryServiceService,
		private userService: UsersService
	) { }

	async getAllProductsWithRelations(): Promise<any> {
		try {
			const products: Product[] = await this.productRepository.find({
				where: { flag: 0 },
				relations: ['category']
			});
			const response = JSON.stringify(products, null, 2);
			if (response.length === 0) {
				return new Result(false, `No table data found`);
			}

			const data = products.map(product => ({
				id: product.id,
				name: product.name,
				min_qty: product.min_qty,
				qty: product.qty,
				sku: product.sku,
				description: product.description,
				flag: product.flag,
				category: product.category.name
			}));
			return new Result(true, 'products data', data)
		} catch (error) {
			return new Result(false, `${error.message}`);
		}
	}

	private CreateResult(success: boolean, message: string, data?: any) {
		return new Result(success, message, data);
	}

	async createProduct(data: createProductDTO) {
		try {
			const { categoryId, min_qty, qty, name, description, sku, userId } = data;
			const user = await this.userService.findUser(userId);

			if (!user) {
				return this.CreateResult(false, `User muust be logged in to add product`);
			}
			const categoryExists = await this.catService.CategoryByd(categoryId);

			if (!categoryExists) {
				return this.CreateResult(false, `Category Id ${categoryId} Not Found`);
			}
			const productExists = await this.productRepository.findOne({ where: { name: name, flag: 0 } });
			if (!productExists) {
				const newProduct = this.productRepository.create({
					min_qty,
					qty,
					name,
					description,
					sku,
					category: categoryExists,
					users: user,
				});

				await this.productRepository.save(newProduct);
				return this.CreateResult(true, `Product ${data.name} Created successfully`);
			}
			return this.CreateResult(false, `Product ${data.name} already exists! Choose a different name`);
		} catch (error) {
			return this.CreateResult(false, `${error.message}`);
		}
	}

	async updateProductQuantity(entityManager: EntityManager, productId: number, purchase_qty: number) {
		try {
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

	async productById(id: number) {
		return await this.productRepository.findOne({ where: { id } });
	}

	private async findOne(id: number) {
		return await this.productRepository.findOne({
			where: { id: id, flag: 0 },
			relations: ['purchases', 'sales', 'users']
		});
	}

	async generateReport(startDate?: Date, endDate?: Date): Promise<any> {
		try {
			const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.purchases', 'purchase')
            .leftJoinAndSelect('purchase.batch', 'batch')
            .select([
				'product.id',
				'product.name',
				'product.description',
				'product.sku',
				'product.min_qty',
				'product.qty',
            ]);

			if (startDate && endDate) {
				queryBuilder.where('product.sell_date BETWEEN :startDate AND :endDate', { startDate, endDate });
			}
			const result = await queryBuilder.getMany();
			return new Result(true, `data`, result);
		} catch (error) {
			return error;
		}
	}
}
