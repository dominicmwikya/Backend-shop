
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from 'src/Entities/User.entity';


export enum actions {
  LOGIN = 'logged',
  LOGOUT =' logout'
}
@Entity()
export class LoginEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 512 })
  refreshTokens : string;

  @Column({ nullable : true})
  last_login?: Date

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type : 'enum', enum : actions})
  action: actions
 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity, user => user.loginToken)
  user!: UserEntity;
}