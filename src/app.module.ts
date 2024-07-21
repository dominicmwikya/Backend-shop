import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src//Entities/Profile.entity';
import { BatchEntity } from 'src/Entities/BatchEntity';
import { CategoryEntity } from 'src/Entities/CategoryEntity';
import { Email } from 'src/Entities/Email';
import { LoginEntity } from 'src/Entities/Login.Entity';
import { PasswordHistory } from 'src/Entities/PasswordHistory';
import { Product } from 'src/Entities/Product.entity';
import { Purchases } from 'src/Entities/Purchases.Entity';
import { Receipt } from 'src/Entities/Receipt.entity';
import { Role } from 'src/Entities/Role.entity';
import { Supplier } from 'src/Entities/Supplier.Entity';
import { UserEntity } from 'src/Entities/User.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Sale } from './Entities/sales.entity';
import { AuthMiddleware } from './Modules/Auth/AuthMiddleware';
import { AuthModule } from './Modules/Auth/AuthModule';
import { BatchModule } from './Modules/Batchs/BatchModule';
import { BatchNumbers } from './Modules/Batchs/entities/BatchNumbers';
import { CategoryModule } from './Modules/category/category.module';
import { EmailModule } from './Modules/Email/Email.Module';
import { ProductModule } from './Modules/Products/ProductModule';
import { PurchaseModule } from './Modules/Purchases/PurchaseModule';
import { ReceiptModule } from './Modules/Receipts/ReceiptModule';
import { SalesModule } from './Modules/Sales/SalesModule';
import { SupplierModule } from './Modules/Suppliers/SupplierModule';
import { UsersModule } from './Modules/Users/UsersModule';
import { LoggerMiddleware } from './Middlewares/LoggerMiddeware';
import { UserLog } from './Entities/Userlogs';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserLog]),
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
          entities: [UserEntity, Profile, Product, Purchases, Sale, Role, Supplier, BatchNumbers, Receipt, Email, CategoryEntity, LoginEntity, PasswordHistory, BatchEntity, UserLog],
          synchronize: true,
        }
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude(
      { path: '/users/login', method: RequestMethod.POST },
      { path: '/users/logout', method: RequestMethod.POST },
      { path: 'users/logs', method: RequestMethod.ALL }
      
    ).forRoutes('*');

    consumer.apply(LoggerMiddleware).exclude(
      { path: '/users/login', method: RequestMethod.POST },
      { path: 'users/token-verification', method: RequestMethod.POST },
      { path: 'users/logs', method: RequestMethod.ALL },
      { path: '/users/logout', method: RequestMethod.POST },
    ) .forRoutes('*');
  }
}
