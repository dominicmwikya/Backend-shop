  import { Profile } from 'src/Modules/Profile/entities/Profile.entity';
  import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
  import { Product } from '../../Products/entities/Product.entity';
  import { Purchases } from '../../Purchases/entities/Purchases.Entity';
  import { Role } from '../../Roles/entities/Role.entity';
  import { Sale } from '../../Sales/entities/sales.entity';
  import { UserStatus } from '../enums/user-enums';
  import { LoginEntity } from './Login.Entity';

  @Entity()
  export class UserEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;
    @Column({ default: '0712162619' })
    phone!: string;
    @Column()
    password!: string;

    @Column({ default: UserStatus.Pending})
    status!: UserStatus;

    @Column({ default: 'user' })
    role!: string;
    @Column()
    code!: string;
    @Column({ default: false })
    activation!: boolean;

    @Column({ default: false })
    codeSent!: boolean

    @OneToOne(() => Profile)
    @JoinColumn()
    profile!: Profile;

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

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
  }