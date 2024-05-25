import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class CategoryEntity extends BaseEntity {

    @PrimaryGeneratedColumn()
         id : number;
    @Column()
         name: string
    @Column({ default: 0})
         status: number
}