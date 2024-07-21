import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CategoryDTO } from '../../../Dtos/AddCategoryDTO';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from '../../../Entities/CategoryEntity';
import { Repository } from 'typeorm';
import { UpdateCategoryDTO } from '../../../Dtos/UpdateCategoryDTO';
import { Result } from '../Response/Result';

@Injectable()
export class CategoryServiceService {
    constructor(@InjectRepository(CategoryEntity) private catRepository: Repository<CategoryEntity>) { }
    //get categories
    async getProductCategories() {
        try {
            return await this.catRepository.find({ where: { status: 0 } });

        } catch (error) {
            return error;
        }
    }

    private CreateResult(success: boolean, message: string, data?: any) {
        return new Result(success, message, data);
    }
    async PostCategory(category: CategoryDTO) {
        try {
            const { name } = category;
            const trimedName = name.trim();

            if (trimedName === '') {
                return new Result(false, `Category name is required`);
            }
            const categoryExists = await this.categoryExists(name);

            if (!categoryExists) {
                const catData = this.catRepository.create({
                    name: name
                });
                
                await this.catRepository.save(catData);
                return this.CreateResult(true, `${name}`, catData);
            }
            return this.CreateResult(false, ` Category name ${name} already exists! Choose a different name`);
        } catch (error) {
            return this.CreateResult(false, `${error.message}`);
        }
    }

    private async categoryExists(name: string) {
        return await this.catRepository.findOne({ where: { name: name, status: 0 }, select: ['name'] });
    }

    async UpdateCategory(data: UpdateCategoryDTO) {
        try {
            const category = await this.CategoryByd(data.id);

            if (category) {
                await this.catRepository.update({ id: data.id }, { name: data.name });

                return new Result(true, `Category with ${data.id} Updated successfully`);
            }
            else {
                throw new NotFoundException(`Category with ID ${data.id} not found`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                return new Result(false, error.message);
            }
            else {
                ;
                return new Result(false, `Failed to update category, ${error.message}`);
            }
        }
    }
    //delet operatio
    async DeleteCategory(id: number) {
        try {
            const exists = await this.CategoryByd(id);

            if (exists !== null) {
                await this.catRepository.update({ id: id }, { status: 1 });
                return new Result(true, `Category id ${id} deleted successfully`);
            }
            else {
                throw new NotFoundException(`cate id ${id} not found`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                return new Result(false, error.message);
            }
            return new Result(false, `Error occured while deleting category with id ${id}. .  ${error.message}`);
        }
    }

     async CategoryByd(id: number){
        return await this.catRepository.findOne({ where: { id: id, status: 0 }, select: ['id'] });
    
    }
}
