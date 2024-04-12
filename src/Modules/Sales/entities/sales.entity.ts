import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../Products/entities/Product.entity';
import { Purchases } from '../../Purchases/entities/Purchases.Entity';
import { Receipt } from '../../Receipts/entities/Receipt.entity';
import { UserEntity } from '../../Users/entities/User.entity';
@Entity()
export class Sale extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sell_date!: Date;
  @Column({ default: null })
  status!: string;

  @ManyToOne(() => Product, product => product.sales, { onDelete: 'CASCADE' })
  @JoinColumn()
  product!: Product;

  @ManyToOne(() => UserEntity, user => user.sales, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: UserEntity;

  @ManyToOne(() => Purchases, purchase => purchase.sales)
  purchase!: Purchases;

  @ManyToOne(() => Receipt, (receipt) => receipt.sales)
  @JoinColumn()
  receipt: Receipt;
}
