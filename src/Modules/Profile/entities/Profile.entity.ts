import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Profile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  first_name!: string;
  @Column()
  last_name!: string;
  @Column()
  avator!: string;
  @Column()
  gender!: string;
  @Column({ type: 'text' })
  bio!: string;

}