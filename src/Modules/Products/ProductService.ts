import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/Modules/Products/entities/Product.entity";
import { EntityManager, Not, Repository } from "typeorm";
import { PurchaseService } from "../Purchases/PurchaseService";
import { createProductDTO } from "./dtos/createProductDTO";
@Injectable()
export class ProductService {
	constructor(@InjectRepository(Product) private productRepository: Repository<Product>,
		private readonly purchaseService: PurchaseService,
	) { }

	async findAll(): Promise<Product[]> {
		try {
			const products: Product[] = await this.productRepository.find({ where: { flag: 0 } });
			if (!products) {
				throw new NotFoundException('Product table is EMPTY. PLS ADD PRODUCTS')
			}
			else{
				return products;
			}
		
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			else{
				throw new InternalServerErrorException(`${error.message}`);
			}
		}
	}

	async createProduct(data: createProductDTO) {
		try {
			const exists_product = await this.productRepository.findOne({ where: { name: data.name, flag: 0 } });
			if (!exists_product) {
				const { name, category, min_qty, qty, sku, description } = data;
				const newProduct = this.productRepository.create({
					name,
					category,
					min_qty,
					qty,
					description,
					sku
				});
				await this.productRepository.save(newProduct);
				return {
					message : `Product ${name} Created successfully`
				}
			}
			throw new ConflictException(`Product ${data.name} already exists! Choose a different name `);
		} catch (error) {
			if (error instanceof ConflictException) {
				throw error;
			}else{
				throw new InternalServerErrorException(`Error occured while adding product! - ${error.message}`);
			}
		}
	}

	async updateProduc1(productId: number, newQty: number) {
		try {
			// Fetch the product from the database
			const productToUpdate = await this.productRepository.findOne({ where: { id: productId } });
			if (productToUpdate) {
				// Update the product's quantity
				productToUpdate.qty = newQty;
				// Save the updated product to the database
				await this.productRepository.save(productToUpdate);

				return { message: 'Product updated successfully' };
			} else {
				return { error: 'Product not found' };
			}
		} catch (error) {
			return {
				error: `Error occured ${productId}`
			}
		}
	}

	async updateProductQuantity (entityManager : EntityManager, productId, purchase_qty) {
		try {
			const product =  await this.productById(productId);
			if (product) {
				let updated_product_qty = product.qty - purchase_qty; 
				return await entityManager.update(Product, { id: productId }, { qty: updated_product_qty },); 
			} 
			else{
				throw new NotFoundException(`Product ${productId} not found`);
			}
		} catch (error) {
			if (error instanceof NotFoundException) {
				return error;
			}
			else{
				throw new InternalServerErrorException(`Error ${error.message}`);
			}
		}
	}
	//
	async updateProduct(id: number, data: any) {
		const product = await this.productRepository.findOne({ where: { id: id } });
		if (!product) {
			throw new HttpException({ error: `product ${id} does not exist in the database` }, HttpStatus.NOT_FOUND)
		}
		try {
			const { name, category, qty, min_qty, sku, description } = data;
			return this.productRepository.update({ id: product.id }, { name, category, qty, min_qty, sku, description: description });
		} catch (error) {
			throw new HttpException({ error: `${error} Error occured while Updating product! Try again` }, HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async deleteProduct(id: number): Promise<boolean | {}> {
		try {
			const product = await this.findOne(id);
			const result = await this.productRepository.update({ id: product.id }, { flag: 1 });
			if (result.affected !== 0) {
				const deleteAssociatedPurchases = await this.purchaseService.deletePurchaseByProductId(product.id);
				if (deleteAssociatedPurchases) {
					return true;
				}
				else {
					return {
						error: `Error deleting purchases with id ${id}`
					}
				}

			} else {
				return {
					error: `Error deleting ${id}`
				}
			}

		} catch (error: any) {
			throw new HttpException(`Failed to update product: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async productById(id: number) {
		return await this.productRepository.findOne({ where: { id: id } });
	}

	async findOne(id: number) {
		return await this.productRepository.findOne({
			where: { id: id, flag: 0 },
			relations: ['purchases', 'sales', 'users']
		});
	}
}
