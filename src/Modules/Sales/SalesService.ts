import {
    Injectable
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, format, startOfDay } from 'date-fns';
import { Sale } from "src/Entities/sales.entity";
import { Pagination } from "src/helpers/Pagination";
import { PaginationData, PaginationOptions } from "src/helpers/paginationOptions";
import { EntityManager, QueryRunner, Repository } from "typeorm";
import { BatchService } from "../Batchs/BatchService";
import { BatchEntity } from "../../Entities/BatchEntity";
import { ProductService } from "../Products/ProductService";
import { Product } from "../../Entities/Product.entity";
import { PurchaseService } from "../Purchases/PurchaseService";
import { Purchases } from "../../Entities/Purchases.Entity";
import { ReceiptService } from "../Receipts/ReceiptService";
import { UsersService } from "../Users/UserService";
import { Result } from "../category/Response/Result";
import { PostSaleDto } from "../../Dtos/PostSaleDto";
import { Transactions } from "src/helpers/Transactions";
@Injectable()
export class SaleService {
    private QueryRuner: QueryRunner;
    constructor(@InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
        private productService: ProductService,
        private purchaseService: PurchaseService,
        private readonly entityManager: EntityManager,
        private receiptService: ReceiptService,
        private userService: UsersService,
        private batchService: BatchService,
        private readonly transactions: Transactions 
    ) { this.QueryRuner = this.entityManager.connection.createQueryRunner(); }

    private CreateResult(success: boolean, message: string, data?: any): Result {
        return new Result(success, message, data);
    }

    async sales(startDate?: Date, endDate?: Date) {
        try {
            const dateResult = this.validateInputDates(startDate, endDate);
            if (dateResult.error) {
                return this.CreateResult(false, dateResult.error);
            }
            let queryBuilder = this.salesRepository
                .createQueryBuilder('sale')
                .leftJoinAndSelect('sale.product', 'product')
                .leftJoinAndSelect('sale.purchase', 'purchase')
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
                status: sale.status,
                batch: sale.purchase?.batchcode,
                model: sale.purchase?.model
            }));
            const results = result.map(sale => ({
                ...sale,
                sell_date: format(new Date(sale.sell_date), 'dd/MM/yyyy')
            }));
            return this.CreateResult(true, `Data fetched successfully`, results);
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

    private validateSaleData(data: PostSaleDto) {
        const {
            purchaseId,
            productId,
            price,
            purchaseQty,
            total,
            userId
        } = data;
        const errors = [];

        if (!userId) {
            errors.push('User ID is required');
        }
        if (!purchaseId) {
            errors.push('Purchase ID is required');
        }
        if (!productId) {
            errors.push('Product ID is required');
        }
        if (price <= 0) {
            errors.push('Price must be greater than 0');
        }
        if (purchaseQty <= 0) {
            errors.push('Purchase quantity must be greater than 0');
        }
        if (total < 0) {
            errors.push('Total must be non-negative');
        }
        return errors;
    }

    private getBalance(dbQty: number, userQty: number) {
        return dbQty - userQty;
    }

    private getTotal(salePrice: number, quantity: number) {
        return salePrice * quantity;
    }
    private async sumTotal(soldQty: number,  itemQty: number) {
        return (soldQty + itemQty);
    }
    async addRecord(data: PostSaleDto) {
      await this.transactions.connectAndStartTransaction(this.QueryRuner);
        try {
            const { purchaseId, productId,price, purchaseQty,total,balance,userId,amount,paymentMethod} = data;
            const errors = this.validateSaleData(data);
            if (errors.length > 0) {
                return this.CreateResult(false, `${errors.join(',')}`, errors);
            }
            const verifyUserIsloggedIn = await this.userService.findUser(userId);
            if (!verifyUserIsloggedIn) {
                return this.CreateResult(false, `Invalid user id`);
            }
            const purchase = await this.entityManager.findOne(Purchases, { where: { id: purchaseId } });
            const batch = await this.entityManager.findOne(BatchEntity, { where: { id: purchaseId } });
            if (!purchase || !batch) {
                return this.CreateResult(false, `Purchase  is ${purchaseId}  or batch  ${productId} Not found`);
            }
            let stockBalance = this.getBalance(batch.purchase_Qty, purchase.soldQty);
            if (stockBalance < purchaseQty) {
                return this.CreateResult(false, `Insufficient Qty to buy ${purchaseQty}`);
            }
            const expectedSaleTotalRevenue = this.getTotal(batch.sale_Price, purchaseQty);
            const bs = expectedSaleTotalRevenue - total;
            const receiptDTO = { grantTotal: total,totalItems: purchaseQty,balance: bs,amount: expectedSaleTotalRevenue, customer_name: "customer_name"
            };
            const receiptNumber = await this.receiptService.createReceipt(this.entityManager, receiptDTO);
            const product = await this.entityManager.findOne(Product, { where: { id: productId } })
            const newSaleData = this.salesRepository.create({
                user: verifyUserIsloggedIn,
                price: price,
                amount: amount,
                total: total,
                quantity: purchaseQty,
                balance: balance,
                status: balance === 0 ? 'COMPLETED' : 'PENDING',
                receipt: receiptNumber,
                product: product,
                purchase: purchase,
                payMode: paymentMethod
            });
            await this.entityManager.save(newSaleData);

            const qty_to_increment_purchase_soldQty = purchase.soldQty + purchaseQty;
            const UpdatePurchaseResult = await this.purchaseService.updatePurchaseQuantity(this.entityManager, purchaseId, qty_to_increment_purchase_soldQty);
            if (UpdatePurchaseResult.affected !== 1) {
                return this.CreateResult(false, `Failed to update purchase quantity , ${UpdatePurchaseResult.message}`)
            }
            const reduceProductQty = product.qty - purchaseQty;
            const productQtyUpdate = await this.productService.updateProductQuantity(this.entityManager, productId, reduceProductQty);
            if (productQtyUpdate.error) {
                const { error } = productQtyUpdate.error;
                return this.CreateResult(false, `updateProductQuantit${error}`);
            }
            await this.transactions.commitTransaction(this.QueryRuner);
            return new Result(true, `Sale Recorded added succssfully`);
        } catch (error) {
        
            await this.transactions.rollbackTransaction(this.QueryRuner);
            return new Result(false, `Error occured: ${error.message}`);
        }
    }

    async generateReceipt(entity: EntityManager, data: any) {
        return await this.receiptService.createReceipt(entity, data);
    }

    async calculatetock(qty: number, soldQty: number, itemQty: number, product: string) {
        const itemStock = (qty - soldQty);

        if (itemStock < itemQty) {
            return new Result(false, `Insufficient quantity for ${product}`);
        }
        return itemStock;
    }

    async calculateExpectedSalePrice(saleprice: number, quantity: number) {
        return saleprice * quantity;
    }
    async rollBackQueryConnector(query: QueryRunner) {
       return await query.rollbackTransaction();
    }
    //add new sale record.
    async createSale(data: any) {
        await this.transactions.connectAndStartTransaction(this.QueryRuner);
        try {
            // const entityManager = hqueryRunner.manager;
            const { customer_name, cart_items, paymentMethod, grantTotal, totalItems, balance, amount } = data;
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
            const receiptNumber = await this.generateReceipt(this.entityManager, receiptData);
            for (const item of items) {
                const purchaseRecord = await this.purchaseService.findByCode(item.batchNumber);
                const batchExists = await this.batchService.findBatchId(item.batchId);

                if (!purchaseRecord) {
                    return new Result(false, `purchase  id ${item.purchaseId}`);
                }
                if (!batchExists) {
                    return new Result(false, `Batch id ${item.batchId}`);
                }

                const quantityInStock = await this.calculatetock(batchExists.purchase_Qty, purchaseRecord.soldQty, item.quantity, purchaseRecord.product.name);
                if (quantityInStock instanceof Result) {
                    return quantityInStock;
                }
                const expectedSalePrice = await this.calculateExpectedSalePrice(batchExists.sale_Price, item.quantity);
                let balance = this.getBalance(item.total, expectedSalePrice);
                const newSale = this.salesRepository.create({
                    price: item.price,
                    total: item.total,
                    quantity: item.quantity,
                    amount: expectedSalePrice,
                    user: item.userId,
                    balance,
                    purchase: purchaseRecord,
                    product: item.productId,
                    receipt: receiptNumber,
                    payMode: paymentMethod,
                    status: item.balance === 0 ? 'COMPLETED' : 'PENDING',
                });

                await this.entityManager.save(newSale);
                const purchaseQtySold =  await this.sumTotal(purchaseRecord.soldQty,  item.quantity);
                const updateResult = await this.purchaseService.updatePurchaseQuantity(this.entityManager, batchExists.id, purchaseQtySold);
                if (updateResult.affected !== 1) {
                    return new Result(false, `Failed to update purchase quantity for batch ${batchExists.id}`);
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
                const updateProduct = await this.productService.updateProductQuantity(this.entityManager, productExists.id, newProductQty);

                if (updateProduct.affected !== 1) {
                    return new Result(false, `"error Updating product qty ${updateProduct.message}`)
                }
            }
          await this.transactions.commitTransaction(this.QueryRuner);
            return new Result(true, 'Sale created successfully');

        } catch (error) {
            await this.transactions.rollbackTransaction(this.QueryRuner);
            return new Result(false, 'Error creating a new sale record', error.message);
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
    //fetch product summary data
    async GetProductSummaryData() {
        try {
            const results = await this.salesRepository.createQueryBuilder("sales")
                .innerJoin("sales.product", "product")
                .select([
                    "product.id AS productId",
                    "product.name AS product",
                    "SUM(sales.total) AS total",
                    "SUM(sales.quantity) AS quantity",
                    "SUM(sales.balance) AS balance",
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
            return this.CreateResult(true, "Product summary data", data);
        } catch (error) {
            return this.CreateResult(false, `Error occured. ${error.message}`);
        }
    }

    async getProductRecord(productId: number) {
        try {
            const results = await this.salesRepository.createQueryBuilder("sales")
                .innerJoin("sales.product", "product")
                .innerJoin('sales.purchase', 'purchase')
                .innerJoin('sales.receipt', 'receipt')
                .innerJoin('sales.user', 'user')
                .select([
                    "product.id AS productId",
                    "product.name AS product",
                    "sales.total AS  total",
                    "sales.quantity AS quantity",
                    "sales.sell_date AS sell_date",
                    "sales.balance AS balance",
                    "sales.id AS salesID",
                    "purchase.model AS model",
                    "receipt.customer_name AS Customer",
                    "user.email as username"
                ])

                .where("product.id = :productId", { productId })
                .andWhere("sales.balance > 0")
                .orderBy("product.id", 'ASC')
                .getRawMany();

            const formatedResult = results.map(result => ({
                ...result,
                sell_date: format(new Date(result.sell_date), "dd/MM/yyyy")
            }))
            return this.CreateResult(true, 'data', formatedResult);

        } catch (error) {
            return this.CreateResult(false, `Error occured. ${error.message}`);
        }
    }

    async generateReport(startDate?: Date, endDate?: Date) {
        try {
            let queryBuilder = this.salesRepository.createQueryBuilder("sale")
                .leftJoinAndSelect('sale.product', 'product')
                .leftJoinAndSelect('sale.purchase', 'purchases')
                .orderBy('sale.sell_date', 'ASC')

            if (startDate && endDate) {
                queryBuilder = queryBuilder.where(`sale.sell_date BETWEEN :startDate AND :endDate`, {
                    startDate: startDate,
                    endDate: endDate
                });
            }
            const sales = await queryBuilder.getMany();
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

            const formateSales = result.map(res => ({
                ...res,
                sell_date: format(new Date(res.sell_date), 'dd/MM/yyyy')
            }))
            return new Result(true, `data fetched successfully`, formateSales);
        } catch (error) {
            return new Result(false, `${error.message}`);
        }
    }
}