import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './Modules/Products/ProductModule';
import { AuthModule } from './Modules/Auth/AuthModule';
import { UsersModule } from './Modules/Users/UsersModule';
import { PurchaseModule } from './Modules/Purchases/PurchaseModule';
import { BatchModule } from './Modules/Batchs/BatchModule';
import { SalesModule } from './Modules/Sales/SalesModule';
import { SupplierModule } from './Modules/Suppliers/SupplierModule';
import { ReceiptModule } from './Modules/Receipts/ReceiptModule';
import { EmailModule } from './Modules/Email/Email.Module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './Modules/Users/entities/User.entity';
import { Profile } from './Modules/Profile/entities/Profile.entity';
import { Product } from './Modules/Products/entities/Product.entity';
import { Purchases } from './Modules/Purchases/entities/Purchases.Entity';
import { Sale } from './Modules/Sales/entities/sales.entity';
import { Role } from './Modules/Roles/entities/Role.entity';
import { Supplier } from './Modules/Suppliers/entities/Supplier.Entity';
import { BatchNumbers } from './Modules/Batchs/entities/BatchNumbers';
import { Receipt } from './Modules/Receipts/entities/Receipt.entity';
import { Email } from './Modules/Email/entities/Email';
import { CategoryModule } from './Modules/category/category.module';
import { CategoryEntity } from './Modules/category/CategoryEntity';
import { LoginEntity } from './Modules/Users/entities/Login.Entity';

@Module({
  imports: [
    ProductModule,
    AuthModule,
    UsersModule,
    PurchaseModule,
    BatchModule,
    SalesModule,
    SupplierModule,
    ReceiptModule,
    EmailModule,
    CategoryModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
         return {
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT) || 3306,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [UserEntity, Profile, Product,Purchases, Sale, Role, Supplier, BatchNumbers, Receipt, Email, CategoryEntity, LoginEntity],
          synchronize: true,
         }
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
