
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Sale } from '../../Sales/entities/sales.entity';

@Entity()
export class Receipt {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    customer_name: string;
    @Column({ default: 0.00 })
    grantTotal: number;
    @Column()
    totalItems: number;
    @Column()
    amount: number;
    @Column()
    balance: number;
    @Column({ nullable: true })
    receiptNumber: string;
    @Column()
    status: string;

    @OneToMany(() => Sale, sales => sales.receipt)
    @JoinColumn()
    sales: Sale[];
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}
