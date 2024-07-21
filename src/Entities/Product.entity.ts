import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Purchases } from './Purchases.Entity';
import { Sale } from './sales.entity';
import { Supplier } from 'src/Entities/Supplier.Entity';
import { UserEntity } from 'src/Entities/User.entity';
import { CategoryEntity } from 'src/Entities/CategoryEntity';
@Entity()
export class Product extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;
	@Column()
	min_qty!: number;

	@Column({ default: 0 })
	qty!: number;

	@Column({ default: null, nullable: true })
	sku!: string;

	@Column({default: null}) 
	model: string;
	
	@Column({ default: null, nullable: true })
	description: string;

	@OneToMany(() => Purchases, purchase => purchase.product, {onUpdate :'CASCADE'})
	@JoinColumn()
	purchases: Purchases[];

	@ManyToOne(() => UserEntity, user => user.products)
	users: UserEntity


	@OneToMany(() => Sale, sale => sale.product)
	@JoinColumn()
	sales!: Sale[];

	@ManyToOne(() => CategoryEntity, category => category.products) 
	category: CategoryEntity

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt!: Date;
	
	@Column({ default: 0 })
	flag!: number;

}