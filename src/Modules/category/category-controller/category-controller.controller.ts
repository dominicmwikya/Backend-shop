import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Put } from '@nestjs/common';
import { CategoryDTO } from '../../../Dtos/AddCategoryDTO';
import { CategoryServiceService } from '../category-service/category-service.service';
import { UpdateCategoryDTO } from '../../../Dtos/UpdateCategoryDTO';

@Controller('category')
export class CategoryControllerController {

  constructor(private catService: CategoryServiceService) { }
  @Get('get')
  async getCategory() {
    try {
      return await this.catService.getProductCategories();
    } catch (error) {
      return error;
    }
  }

  @Post('add')
  async postProduct(@Body('data') data: CategoryDTO) {
    try {
      return this.catService.PostCategory(data);
    } catch (error) {
      return error;
    }
  }

  @Put('update')
  async UpdateCategory(@Body('data') data: UpdateCategoryDTO) {
    try {
      return await this.catService.UpdateCategory(data);

    } catch (error) {

      return error;
    }
  }

  @Delete('/:id')
  async DeleteCategory(@Param('id') id: number) {
    try {
      return await this.catService.DeleteCategory(id);

    } catch (error) {

      return error;
    }
  }
}
