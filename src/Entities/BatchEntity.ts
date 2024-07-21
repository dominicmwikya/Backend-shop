import { Purchases } from "src/Entities/Purchases.Entity";
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Supplier } from "./Supplier.Entity";

@Entity()
export class BatchEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    purchase_Qty!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    purchase_Price!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    sale_Price!: number;

    @Column()
    purchase_Total!: number;

    @Column()
    batchNumber: string;

    @OneToOne(() => Purchases, purchases => purchases.batch)
    @JoinColumn()
    purchase: Purchases;

    @OneToOne(() => Supplier)
    @JoinColumn()
    supplier: Supplier


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}