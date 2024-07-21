import { UserEntity } from './User.entity';
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @OneToOne(() =>UserEntity, user => user.profile)
  @JoinColumn()
  user: UserEntity
}