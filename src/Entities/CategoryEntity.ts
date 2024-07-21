import {
     BaseEntity,
     Column,
     Entity,
     OneToMany,
     PrimaryGeneratedColumn
} from "typeorm";
import { Product } from "./Product.entity";


@Entity()
export class CategoryEntity extends BaseEntity {

     @PrimaryGeneratedColumn()
     id: number;
     @Column()
     name: string
     @Column({ default: 0 })
     status: number

     @OneToMany( () => Product, product => product.category)
     products:[]
     
}