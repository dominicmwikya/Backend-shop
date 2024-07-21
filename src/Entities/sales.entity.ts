import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './Product.entity';
import { Purchases } from './Purchases.Entity';
import { Receipt } from 'src/Entities/Receipt.entity';
import { UserEntity } from './User.entity';
import { Transform } from 'class-transformer'
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
  @Column()
  payMode: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value.toLocaleString('en-US', { timeZone: 'UTC' }))
  sell_date!: Date;
  @Column({ default: null })
  status!: string;

  @ManyToOne(() => Product, product => product.sales)
  @JoinColumn()
  product!: Product;

  @ManyToOne(() => UserEntity, user => user.sales)
  @JoinColumn()
  user!: UserEntity;

  @ManyToOne(() => Purchases, purchase => purchase.sales)
  purchase!: Purchases;

  @ManyToOne(() => Receipt, (receipt) => receipt.sales)
  @JoinColumn()
  receipt: Receipt;

}
