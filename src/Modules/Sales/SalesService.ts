import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { Sale } from "src/Modules/Sales/entities/sales.entity";
import { Pagination } from "src/helpers/Pagination";
import { PaginationData, PaginationOptions } from "src/helpers/paginationOptions";
import { EntityManager, Raw, Repository } from "typeorm";
import { ProductService } from "../Products/ProductService";
import { PurchaseService } from "../Purchases/PurchaseService";
import { ReceiptService } from "../Receipts/ReceiptService";
import { PostSaleDto } from "./dtos/PostSaleDto";
import { UserEntity } from "../Users/entities/User.entity";
import { Purchases } from "../Purchases/entities/Purchases.Entity";
import { Product } from "../Products/entities/Product.entity";
import { Result } from "../category/Response/Result";
import { error } from "console";
@Injectable()
export class SaleService {
    constructor(@InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
        private productService: ProductService,
        private purchaseService: PurchaseService,
        private readonly entityManager: EntityManager,
        private receiptService: ReceiptService,
    ) { }

    private CreateResult(success: boolean, message: string, data: {}): Result {
        return new Result(success, message, data);
    }

    async sales(startDate?: Date, endDate?: Date) {
        try {
            const dateResult = this.validateInputDates(startDate, endDate);

            if (dateResult.error) {
                return this.CreateResult(false, dateResult.error, {});
            }

            let queryBuilder = this.salesRepository
                .createQueryBuilder('sale')
                .leftJoinAndSelect('sale.product', 'product')
                .leftJoinAndSelect('sale.purchase', 'purchases')
                .leftJoinAndSelect('sale.user', 'user')
                .orderBy('sale.sell_date', 'ASC');

            if (startDate && endDate) {
                const startOfDayDate = startOfDay(startDate);
                const endOfDayDate = endOfDay(endDate);
                const formattedStartDate = format(startOfDayDate, 'yyyy-MM-dd HH:mm:ss');
                const formattedEndDate = format(endOfDayDate, 'yyyy-MM-dd HH:mm:ss');

                queryBuilder = queryBuilder.where(
                    `DATE(sale.sell_date) BETWEEN :startDate AND :endDate`,
                    {
                        startDate: formattedStartDate,
                        endDate: formattedEndDate
                    });
            }

            const sales = await queryBuilder.getMany();
            const result = sales.map((sale) => ({
                id: sale.id,
                product: sale.product.name,
                quantity: sale.quantity,
                price: sale.price,
                total: sale.total,
                balance: sale.balance,
                amount_paid: sale.amount,
                sell_date: format(sale.sell_date, 'yyyy-MM-dd HH:mm:ss'),
                status: sale.status
            }));

            return this.CreateResult(true, `Data fetched successfully`, result);

        } catch (error) {
            return this.CreateResult(false, error.message, {});
        }
    }

    private validateInputDates(startDate?: Date, endDate?: Date) {
        if (startDate && endDate) {
            if (startDate > endDate) {
                return { error: 'Start date cannot be after end date.' };
            }
        } else if (startDate && !endDate) {
            return { error: 'End date is required if start date is provided.' };
        } else if (!startDate && endDate) {
            return { error: 'Start date is required if end date is provided.' };
        }
        return {};
    }

    async addRecord(data: PostSaleDto) {
        const queryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const entityManager = queryRunner.manager;
        try {
            const { purchaseId,
                productId,
                price,
                purchaseQty,
                total,
                balance = 0
            } = data;

            const userId: number = data.userId;
            const logged_user = await entityManager.findOne(UserEntity, { where: { id: userId } });
            const purchase = await this.entityManager.findOne(Purchases, { where: { id: purchaseId } });

            if (!purchase) {
                throw new NotFoundException(`Purchase is ${purchaseId} Not found`);
            }

            let stockBalance = purchase.purchase_Qty - purchase.soldQty;
            if (stockBalance < purchaseQty) {
                throw new BadRequestException(`Insufficient Qty to buy ${purchaseQty}`);
            }

            const Expected_sale_total_revenue = purchase.sale_Price * purchaseQty;
            const bs = Expected_sale_total_revenue - total;
            const receiptDTO = {
                grantTotal: total,
                totalItems: purchaseQty,
                balance: bs,
                amount: Expected_sale_total_revenue,
                customer_name: "customer_name"
            };

            const receiptNumber = await this.receiptService.createReceipt(entityManager, receiptDTO);
            const product = await this.entityManager.findOne(Product, { where: { id: productId } })
            const new_sale_data = this.salesRepository.create({
                user: logged_user,
                price: price,
                amount: Expected_sale_total_revenue,
                total: total,
                quantity: purchaseQty,
                balance: bs,
                status: balance === 0 ? 'COMPLETED' : 'PENDING',
                receipt: receiptNumber,
                product: product,
                purchase: purchase
            });
            await entityManager.save(new_sale_data);

            const qty_to_increment_purchase_soldQty = purchase.soldQty + purchaseQty;
            const UpdatePurchaseResult = await this.purchaseService.updatePurchaseQuantity(entityManager, purchaseId, qty_to_increment_purchase_soldQty);
            if (UpdatePurchaseResult.affected !== 1) {
                throw new InternalServerErrorException(`Failed to update purchase quantity , ${UpdatePurchaseResult.message}`);
            }
            const product_exist = await this.productService.productById(productId);
            if (!product_exist) {
                throw new NotFoundException(`Product id ${productId} not found in db`);
            }
            const productUpdate = await this.productService.updateProductQuantity(entityManager, productId, purchaseQty);

            if (productUpdate.affected !== 1) {
                throw new InternalServerErrorException(`Failed to update purchase quantity , ${productUpdate.message}`);
            }

            await queryRunner.commitTransaction();
            return new Result(true, `Sale Recorded added succssfully`);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                return new Result(false, `Exemption error: ${error.message}`);
            }
            return new Result(false, `Error occured: ${error.message}`);
        }
        finally {
            await queryRunner.release()
        }
    }
    //add new sale record.
    async createSale(data: any) {
        const queryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const entityManager = queryRunner.manager;
            const { customer_name, cart_items, grantTotal, totalItems, balance, amount } = data;
            const items = Array.isArray(cart_items) ? cart_items : [cart_items];
            const productQuantityChanges = new Map();
            const receiptData = {
                grantTotal: grantTotal,
                totalItems: totalItems,
                balance: balance,
                amount,
                customer_name
            };
            //create and obtain receipt number
            const receiptNumber = await this.receiptService.createReceipt(entityManager, receiptData);

            for (const item of items) {
                const batchExists = await this.purchaseService.findOne(item.batchId);

                if (!batchExists || !batchExists.product) {
                    throw new NotFoundException(`Batch id ${item.batchId}`);
                }
                const quantityInStock = batchExists.purchase_Qty - batchExists.soldQty;

                if (quantityInStock < item.quantity) {
                    throw new BadRequestException(`Insufficient quantity for ${batchExists.product.name}`);
                }

                let expectedSalePrice = batchExists.sale_Price * parseFloat(item.quantity);
                let balance = parseFloat(item.total) - expectedSalePrice;

                const newSale = this.salesRepository.create({
                    price: item.price,
                    total: item.total,
                    quantity: item.quantity,
                    amount: expectedSalePrice,
                    user: item.userId,
                    balance,
                    product: item.productId,
                    receipt: receiptNumber,
                    status: item.balance === '0' ? 'COMPLETED' : 'PENDING',
                });

                await entityManager.save(newSale);
                const purchaseQtySold = batchExists.soldQty + item.quantity;
                const updateResult = await this.purchaseService.updatePurchaseQuantity(entityManager, batchExists.id, purchaseQtySold);
                if (updateResult.affected !== 1) {
                    throw new InternalServerErrorException(`Failed to update purchase quantity for batch ${batchExists.id}`);
                }
                if (!productQuantityChanges.has(item.productId)) {
                    productQuantityChanges.set(item.productId, 0);
                }
                productQuantityChanges.set(item.productId, productQuantityChanges.get(item.productId) + item.quantity);
            }
            //updateproduct qty
            for (const [productId, quantityChange] of productQuantityChanges) {
                const productExists = await this.productService.productById(productId);
                const newProductQty = productExists.qty - quantityChange;
                console.log("roductExists.qty" + productExists.qty + "Qty Change" + quantityChange + "new product qty" + newProductQty);
                const updateProduct = await this.productService.updateProductQuantity(entityManager, productExists.id, newProductQty);

                if (updateProduct.affected !== 1) {
                    throw new InternalServerErrorException(`"error Updating product qty ${updateProduct.message}`)
                }
            }
            await queryRunner.commitTransaction();
            return new Result(true, 'Sale created successfully');

        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof BadRequestException || error instanceof InternalServerErrorException || error instanceof NotFoundException) {
                return new Result(false, error.message);
            }
            return new Result(false, 'Error creating a new sale record', error.message);
        } finally {
            await queryRunner.release();
        }
    }
    //backend pagination when fetching sales
    async fetchSales(options: PaginationOptions): Promise<PaginationData<Sale>> {
        const Result = await Pagination(this.salesRepository, options);
        return Result;
    }

    async findOneById(id: number) {
        return this.salesRepository.findOne({ where: { id: id } });
    }
    //invoicedata
    async invoiceData() {
        try {
            return this.receiptService.fetchInvoices();
        } catch (error) {
            return error
        }
    }
    //invoice details
    async invoiceDetails(id: string) {
        try {
            const salesData = await this.salesRepository.createQueryBuilder('sales')
                .leftJoinAndSelect('sales.receipt', 'receipt')
                .leftJoinAndSelect('sales.product', 'product')
                .where('receipt.id = :id', { id })
                .getMany();

            return salesData;
        } catch (error) {
            throw error;
        }
    }
    //fetch product summary dat
    async GetProductSummaryData() {
        try {
            const results = await this.salesRepository.createQueryBuilder("sales")
                .innerJoin("sales.product", "product")
                .select([
                    "product.id AS productId",
                    "product.name AS product",
                    "SUM(sales.total) AS total",
                    "SUM(sales.quantity) AS quantity",
                    "SUM(sales.balance) AS balance"

                ])

                .groupBy("product.id")
                .orderBy("product.id", 'ASC')
                .getRawMany();

            const data = results.map((result) => ({
                productId: result.productId,
                product: result.product,
                total: parseFloat(result.total).toFixed(2),
                quantity: parseFloat(result.quantity),
                balance: parseFloat(result.balance).toFixed(2),
                viewButton: parseFloat(result.balance) > 0 ? "View" : "Cleared"
            }));

            return new Result(true, "Product summary data", data);

        } catch (error) {
            return new Result(false, `Error occured. ${error.message}`);
        }
    }

    async test(productId: number) {
        try {
            const results = await this.salesRepository.createQueryBuilder("sales")
                .innerJoin("sales.product", "product")
                .select([
                    "product.id AS productId",
                    "product.name AS product",
                    "sales.total AS  total",
                    "sales.quantity AS quantity",
                    "sales.sell_date AS sell_date",
                    "sales.balance AS balance"
                ])

                .where("product.id = :productId", { productId })
                .andWhere("sales.balance > 0")
                .orderBy("product.id", 'ASC')
                .getRawMany();
            return new Result(true, 'data', results);

        } catch (error) {
            return new Result(false, `Error occured. ${error.message}`);
        }
    }

    async generateReport(startDate?: Date, endDate?: Date) {
        try {
            let queryRunner = this.salesRepository.createQueryBuilder("sale")
                .leftJoinAndSelect('sale.product', 'product')
                .leftJoinAndSelect('sale.purchase', 'purchases')
                .orderBy('sale.sell_date', 'ASC')

            if (startDate && endDate) {
                queryRunner = queryRunner.where(`sale.sell_date BETWEEN :startDate AND :endDate`, {
                    startDate: startDate,
                    endDate: endDate
                });
            }
            const sales = await queryRunner.getMany();
            const result = sales.map((sale) => ({
                id: sale.id,
                productName: sale.product.name,
                quantity: sale.quantity,
                price: sale.price,
                total: sale.total,
                balance: sale.balance,
                amount_paid: sale.amount,
                sell_date: sale.sell_date,
            }));
            return result;
        } catch (error) {
            return error.message;
        }
    }

}