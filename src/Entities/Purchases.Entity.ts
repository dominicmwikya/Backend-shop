import { BatchEntity } from 'src/Entities/BatchEntity';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './Product.entity';
import { Sale } from './sales.entity';
import { UserEntity } from 'src/Entities/User.entity';
@Entity()
export class Purchases extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => Product, product => product.purchases)
	@JoinColumn()
	product!: Product;

	@Column()
	model: string;

	@ManyToOne(() => UserEntity, user => user.purchases, {onUpdate: 'CASCADE' })
	user!: UserEntity;

	@OneToMany(() => Sale, sale => sale.purchase)
	@JoinColumn()
	sales!: Sale[]

	@Column({ default: 0 })
	soldQty!: number;

	@Column({ default: 0 })
	status!: number
	@Column({ nullable: true })
	batchId: number;
	@Column()
	batchcode!: string;

	@Column({ default: 0 })
	flag!: number;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt!: Date;
	@OneToOne(() => BatchEntity, batch => batch.purchase)
	@JoinColumn()
	batch: BatchEntity

}