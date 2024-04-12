import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity()
export class BatchNumbers extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;
}
