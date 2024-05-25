import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { format } from "date-fns";
import { Receipt } from "src/Modules/Receipts/entities/Receipt.entity";
import { EntityManager, Repository } from "typeorm";
import { ReceiptDTO } from "./dtos/ReceiptDTO";
@Injectable()
export class ReceiptService {
    constructor(
        @InjectRepository(Receipt) private ReceiptRepository: Repository<Receipt>,
    ) { }

    private async generateReceiptNumber(id: number): Promise<string> {
        const timestamp = new Date();
        const dateFormate = format(timestamp, 'yyMMdd');
        return `Re${dateFormate}${id}`;
    }

    async createReceipt(entityManager: EntityManager, data: ReceiptDTO): Promise<any> {
        const { customer_name, grantTotal, totalItems, amount, balance } = data;
        const newReceipt = this.ReceiptRepository.create({
            customer_name: customer_name,
            totalItems: totalItems,
            amount: amount,
            grantTotal: grantTotal,
            balance: balance,
            status: balance === 0 ? 'Paid' : 'Due',
        });

        return entityManager.transaction(async (transactionalEntityManager) => {
            try {
                // Save the receipt entity within the transaction
                const result = await transactionalEntityManager.save(newReceipt);
                // Generate the receipt number
                const receiptNo = await this.generateReceiptNumber(result.id);
                // Update the receipt entity with the receipt number
                result.receiptNumber = receiptNo;
                // Update the receipt entity within the transaction
                await transactionalEntityManager.update(Receipt, result.id, { receiptNumber: receiptNo });
                return result;
            } catch (error) {
                return error;
            }
        });
    }

    async fetchInvoices() {
        try {
            return this.ReceiptRepository
                .createQueryBuilder('invoices')
                .orderBy('invoices.id', 'DESC')
                .getMany();

        } catch (error) {
            return error
        }
    }

}
