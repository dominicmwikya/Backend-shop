import { Module } from '@nestjs/common';
import { CategoryControllerController } from './category-controller/category-controller.controller';
import { CategoryServiceService } from './category-service/category-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './CategoryEntity';

@Module({
  controllers: [CategoryControllerController],
  providers: [CategoryServiceService],
  imports:[TypeOrmModule.forFeature([ CategoryEntity])]
})
export class CategoryModule {}
