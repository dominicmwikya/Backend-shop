import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
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
@Injectable()
export class SaleService {
    constructor(@InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
        private productService: ProductService,
        private purchaseService: PurchaseService,
        private readonly entityManager: EntityManager,
        private receiptService: ReceiptService,

    ) { }

    async sales(startDate?: Date, endDate?: Date) {
        try {
            if (startDate && endDate) {
                const formattedStartDate = format(startDate, 'yyyy-MM-dd 00:00:00');
                const formattedEndDate = format(endDate, 'yyyy-MM-dd 23:59:59');
                const salesByStartEndDate =await this.salesRepository
                        .createQueryBuilder('sale')
                        .leftJoinAndSelect('sale.product', 'product')
                        .leftJoinAndSelect('sale.purchase', 'purchases')
                        .where(`DATE(sale.sell_date) BETWEEN :startDate AND :endDate`, { startDate: formattedStartDate, endDate: formattedEndDate })
                        .orderBy('sale.sell_date', 'ASC')
                        .getMany();
                return salesByStartEndDate;                          
            }
            else{
                const sales = await this.salesRepository
                .createQueryBuilder('sale')
                .leftJoinAndSelect('sale.product', 'product')
                .leftJoinAndSelect('sale.purchase', 'purchases')
                .orderBy('sale.sell_date', 'ASC')
                .getMany();
               
                return sales
            }
        } catch (error) {
            return error.message; 
        }
      }

      async addRecord(data: PostSaleDto) {
        const queryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const entityManager = queryRunner.manager;
        const { purchaseId, productId, customer_name, qty, batchId, price,product_name, purchaseQty, total, balance =0, } = data;
        const userId: number = data.userId;
        const logged_user = await entityManager.findOne(UserEntity, {where : {id: userId}});

        try {
            const purchase = await this.entityManager.findOne(Purchases, {where:{id: purchaseId}});
            
            if (!purchase) {
             
                throw new NotFoundException(`Purchase is ${purchaseId} Not found`);
            }
         else{
            let stockBalance  = purchase.purchase_Qty - purchase.soldQty;
            let bs = stockBalance - purchaseQty;
            if (stockBalance < purchaseQty) {
                throw new HttpException(`Insufficient Qty to buy ${purchaseQty}`, HttpStatus.BAD_REQUEST);
            }
            else{
                let Expected_sale_total_revenue = purchase.sale_Price * Number(purchaseQty);
                const balance_les_expected_total = total - Expected_sale_total_revenue;

                const receiptDTO = {
                        grantTotal : 10,
                        totalItems : 10,
                        balance: balance_les_expected_total,
                        amount : total,
                        customer_name: customer_name
                };
                const receiptNumber = await this.receiptService.createReceipt(entityManager, receiptDTO);
                const product_entity = await this.entityManager.findOne(Product, {where:{ id : productId}})
                const new_sale_record = this.salesRepository.create({
                    user : logged_user,
                    price: price,
                    amount : Expected_sale_total_revenue,
                    total : total,
                    quantity: purchaseQty,
                    balance : 0,
                    status: balance === 0 ? 'COMPLETED' :'PENDING',
                    receipt : receiptNumber,
                    product :product_entity,
                    purchase :purchase
                });
                await entityManager.save(new_sale_record);
                const qty_to_increment_purchase_soldQty = purchase.soldQty + purchaseQty;
                try {
                   await this.purchaseService.updatePurchaseQuantity(entityManager, batchId, qty_to_increment_purchase_soldQty);
                } catch (error) {
                    return error;
                }
                //decrement product available qty
                try {
                    let db_product = await this.productService.productById(productId);
                        if (db_product) {
                            // let new_product_qty = db_product.qty - purchaseQty;
                            await this.productService.updateProductQuantity(entityManager, productId, purchaseQty);
                            await queryRunner.commitTransaction();
                        }
                        else{
                            throw new NotFoundException(`Product id ${productId} not found in db`);
                        }
                } catch (error) {
                    if (error instanceof NotFoundException) {
                        return error;
                    }
                }
            }
           
         }

        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof HttpException) {
                return error;
            }
            if ( error instanceof NotFoundException) {
                return error;
            }
            else{
                throw new InternalServerErrorException(`Error! failed to create sale record . ${error.message}`);
            }   
        }
        finally {
            await queryRunner.release()
        } 
      }
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
                grantTotal : grantTotal,
                totalItems : totalItems,
                balance: balance,
                amount,
                customer_name
              };

            const receiptNumber = await this.receiptService.createReceipt(entityManager, receiptData);

            await Promise.all(
                items.map(async (item) => {
                    item.customer_name = customer_name;
                    const batchExists = await this.purchaseService.findOne(item.batchId);

                    if (!batchExists || !batchExists.product) {

                        throw new NotFoundException(`Batch id ${item.batchId}`)
                        
                    } else {
                        let quantityInStock = batchExists.purchase_Qty - batchExists.soldQty;

                        if (quantityInStock < item.quantity) {
                            throw new NotFoundException(`Insufficient Quantity for ${batchExists.product.name}`)
                        } else {
                            let expectedSalePrice = batchExists.sale_Price * parseFloat(item.quantity);
                            let balance = parseFloat(item.total) - expectedSalePrice;

                            const newSale = this.salesRepository.create({
                                price: item.price,
                                total: item.total,
                                quantity: item.quantity,
                                amount: expectedSalePrice,
                                user: item.userId,
                                balance: balance,
                                product: item.productId,
                                receipt: receiptNumber,
                                status: item.balance === '0' ? 'COMPLETED' : 'PENDING',
                            });

                            await entityManager.save(newSale);

                            const purchaseQtySold = Number(batchExists.soldQty) + Number(item.quantity);

                            if (!productQuantityChanges.has(item.productId)) {
                                productQuantityChanges.set(item.productId, 0);
                            }
                            productQuantityChanges.set(item.productId, productQuantityChanges.get(item.productId) - Number(item.quantity));

                           try {
                                  await this.purchaseService.updatePurchaseQuantity(entityManager, item.batchNumber, purchaseQtySold);
                           } catch (error) {
                               if (error instanceof InternalServerErrorException) {
                                 return error;
                               }
                               if (error instanceof NotFoundException) {
                                return error
                               }
                               else{
                                return error;
                               }
                           }
                            
                        }
                    }
                })
            );

            for (const [productId, quantityChange] of productQuantityChanges) {
                const productExists = await this.productService.productById(productId);
                const newProductQty = Number(productExists.qty) + quantityChange;
                   await this.productService.updateProductQuantity(entityManager, productId, newProductQty);
            }
          
            await queryRunner.commitTransaction();

            return { success: true, message: "Sale created successfully" };
           
        } catch (error) {
            await queryRunner.rollbackTransaction();
             if (error instanceof NotFoundException) {
                return { success: false, message: error.message };
             }
             else{
                return { success: false, message: `An error occurred while creating the sale, ${error.message}`, };
              }
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

    async monthlyProductSales() {
        const today = new Date();
        const endDateFormatted = subDays(today, 30);
        const startDateFormatted = format(endDateFormatted, 'yyyy-MM-dd 00:00:00');
        const lastDayOfToday = format(today, 'yyyy-MM-dd 23:59:59');
        const saleByDate = await this.salesRepository
            .createQueryBuilder('sale')
            .select('DATE(sale.sell_date) AS date')
            .addSelect('product.name AS productName')
            .addSelect('SUM(sale.total) AS TotalRevenue')
            .addSelect('SUM(sale.quantity) AS TotalQuantity')
            .addSelect('SUM(sale.amount) AS TotalAmount')
            .innerJoin('sale.product', 'product')
            .where(`DATE(sale.sell_date) BETWEEN :startDate AND :endDate`, {
                startDate: startDateFormatted,
                endDate: lastDayOfToday
            })
            .groupBy('DATE(sale.sell_date), product.name')
            .orderBy('date', 'DESC')
            .getRawMany();

        const salesMap = new Map<string, number>();
        saleByDate.forEach((sale) => {
            let saleDate = format(sale.date, 'yyyy/MM/dd');
            let total = Number(sale.TotalRevenue);
            if (salesMap.has(saleDate)) {
                salesMap.set(saleDate, salesMap.get(saleDate) + total);
            } else {
                salesMap.set(saleDate, total);
            }
        })
        const salesm = Array.from(salesMap).map(([date, total]) => ({
            date,
            total,
        }));
        const formattedResults = saleByDate.map((result) => ({
            date: format(result.date, 'yyyy/MM/dd'),
            productName: result.productName,
            TotalRevenue: result.TotalRevenue,
            TotalQuantity: result.TotalQuantity,
            TotalAmount: result.TotalAmount,
            TotalBalance: result.TotalBalance,
            status: result.TotalBalance === '0' ? 'Complete' : 'Due'
        }));
        return {
            results: formattedResults,
            chartDt: salesm
        };
    }

    //fetch all daily sailes
    async getSales() {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const startDateFormatted = format(startOfToday, 'yyyy-MM-dd 00:00:00');
        const endtoday = format(endOfToday, 'yyyy-MM-dd 23:59:59');
        const todaysales = await this.salesRepository
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.product', 'product')
            .where('sale.sell_date BETWEEN :start AND :end', {
                start: startDateFormatted,
                end: endtoday,
            })
            .orderBy('sale.sell_date', 'DESC')
            .getMany();
        // Calculate total sales for today and group them by product name
        const productMap = new Map<string, number>();
        todaysales.forEach((sale) => {
            const productName = sale.product.name;
            const total = Number(sale.total);

            if (productMap.has(productName)) {
                productMap.set(productName, productMap.get(productName) + total);
            } else {
                productMap.set(productName, total);
            }
        });

        const productTotalsToday = Array.from(productMap).map(([name, total]) => ({
            name,
            total,
        }));
        // Fetch all sales records
        const allSales = await this.salesRepository
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.product', 'product')
            .leftJoinAndSelect('sale.receipt', 'receipt')
            .orderBy('sale.sell_date', 'DESC')
            .getMany();
        // Calculate total sales for all sales
        let totalSumAll = 0;
        allSales.forEach((sale) => {
            totalSumAll += Number(sale.total);
        });
        return {
            todays: productTotalsToday,
            sales: allSales,
            TotalRevenue: totalSumAll,
        };
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
            const salesData = await this.salesRepository
                .createQueryBuilder('sales')
                .leftJoinAndSelect('sales.receipt', 'receipt')
                .leftJoinAndSelect('sales.product', 'product')
                .where('receipt.id = :id', { id })
                .getMany();
            return salesData;
        } catch (error) {
            throw error;
        }
    }

    async test(productName: string, date: any) {
        const formattedDate = date.replace(/\//g, '-');
        const selection = await this.salesRepository.find({
            relations: {
                product: true
            },
            where: {
                product: {
                    name: `${productName}`
                },
                sell_date: Raw(alias => `DATE(${alias}) = DATE('${formattedDate}')`),
            },
        })
        return selection
    }

}