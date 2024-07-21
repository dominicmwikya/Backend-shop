import { Profile } from 'src/Entities/Profile.entity';
import { BaseEntity, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from 'src/Entities/Product.entity';
import { Purchases } from 'src/Entities/Purchases.Entity';
import { Role } from 'src/Entities/Role.entity';
import { Sale } from 'src/Entities/sales.entity';
import { UserStatus } from 'src/Enums/user-enums';
import { LoginEntity } from 'src/Entities/Login.Entity';
import { PasswordHistory } from 'src/Entities/PasswordHistory';


@Entity()
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', {unique : true})
  username!: string;

  // @Index({ unique : true})
  @Column('varchar', { unique: true })
  email!: string;

  @Column({ default: '0712162619' })
  phone!: string;
  @Column()
  password!: string;

  @Column({ default: UserStatus.Pending })
  status!: UserStatus;

  @Column({ default: 'user' })
  role!: string;
  
  @Column()
  code!: string;

  @Column('boolean',{ default: false })
  activation!: boolean;

  @Column({ default: false })
  codeSent!: boolean

  @OneToOne(() => Profile)
  @JoinColumn()
  profile: Profile;

  @Column({ default: 0 })
  flag: number

  @OneToMany(() => Purchases, purchase => purchase.user)
  purchases!: Purchases[];

  @OneToMany(() => Sale, sales => sales.user)
  sales!: Sale[];

  @ManyToMany(() => Role, role => role.users)
  @JoinTable()
  roles!: Role[];

  @OneToMany(() => Product, product => product.users)
  products!: Product[]

  @OneToMany(() => LoginEntity, login => login.user)
  loginToken!: LoginEntity[];

  @OneToMany(() => PasswordHistory, passwordhistory => passwordhistory.user)
  passwordhistory: PasswordHistory[]

  @Column({name :"createDate" , type: 'timestamp' ,  default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date;

  @UpdateDateColumn({name :"updateDateTime"  })
  updateDateTime: Date;
}