import { Module } from '@nestjs/common';
import { CategoryControllerController } from './category-controller/category-controller.controller';
import { CategoryServiceService } from './category-service/category-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../../Entities/CategoryEntity';
import { Product } from '../../Entities/Product.entity';
import { ProductService } from '../Products/ProductService';
import { Purchases } from '../../Entities/Purchases.Entity';
import { PurchaseService } from '../Purchases/PurchaseService';
import { BatchNumbers } from '../Batchs/entities/BatchNumbers';
import { BatchService } from '../Batchs/BatchService';
import { ProductModule } from '../Products/ProductModule';
import { PurchaseModule } from '../Purchases/PurchaseModule';
import { BatchModule } from '../Batchs/BatchModule';
import { UsersService } from '../Users/UserService';
import { UserEntity } from 'src/Entities/User.entity';
import { Bcryptpassword } from '../../helpers/bycrpt.util';
import { LoginEntity } from 'src/Entities/Login.Entity';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../Email/Email.Module';
import { AuthModule } from '../Auth/AuthModule';
import { PasswordHistory } from 'src/Entities/PasswordHistory';
import { BatchEntity } from '../../Entities/BatchEntity';
import { TransactionsModule } from 'src/helpers/TransactionsModule';

@Module({
  imports:[
    TypeOrmModule.forFeature(
    [
      PasswordHistory,
      CategoryEntity,
      Product,
      Purchases,
      BatchNumbers,
      UserEntity,
      LoginEntity,
      BatchEntity
    ]),
    JwtModule,
    EmailModule,
    AuthModule,
    TransactionsModule

  ],

  controllers: [CategoryControllerController],
  providers: [CategoryServiceService, ProductService, Bcryptpassword, BatchService, PurchaseService, UsersService],
  exports : [CategoryServiceService, TypeOrmModule]
})
export class CategoryModule {}
