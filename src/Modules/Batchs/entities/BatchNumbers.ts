import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity()
export class BatchNumbers extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;


    // @Column()
    // yearMonth: string;
    
    // @Column() 
    // sequenceNumber: number;
}
