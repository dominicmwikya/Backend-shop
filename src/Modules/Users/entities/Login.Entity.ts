
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './User.entity';


@Entity()
export class LoginEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ length: 512 })
    refreshTokens!: string;
  
    @Column({ type: 'timestamp' })
    expiresAt!: Date;
  
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
  
    @ManyToOne(() => UserEntity, user => user.loginToken, { onDelete: 'CASCADE' })
    user!: UserEntity;
}