import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "src/Entities/User.entity";

@Entity()
export class PasswordHistory extends BaseEntity {
 @PrimaryGeneratedColumn()
 id: number;

 @Column('text')
 passwordHash: string;
 
 @ManyToOne( () => UserEntity, user => user.passwordhistory)
 user: UserEntity
}