import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Supplier } from "src/Entities/Supplier.Entity";
import { Repository } from "typeorm";
import { supplierInterface } from "../../Dtos/supplier.DTO";

@Injectable()
export class SupplierService {
    constructor(@InjectRepository(Supplier) private supplierRepository: Repository<Supplier>) { }

    async createSupplier({
        name,
        email,
        phone,
        address,
    }: supplierInterface): Promise<null | object> {
        const supplierExists = await this.supplierRepository.findOneBy({ name });

        try {
            if (supplierExists) {
                throw new Error(`Supplier with name ${name} already exists`);
            }

            const supplierObj = new Supplier();
            supplierObj.name = name;
            supplierObj.phone = phone;
            supplierObj.address = address;
            supplierObj.email = email;

            await this.supplierRepository.save(supplierObj);

            return {
                message: `Supplier name ${name} added successfully`,
                success: true,
            };
        } catch (error: any) {
            throw new Error(`Failed to create supplier: ${error.message}`);
        }
    }

    async getSuppliers(): Promise<Supplier[] | null> {
        try {
            const result = await this.supplierRepository.find();
            return result;
        } catch (error: any) {
            return error
        }
    }

}