import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "src/Entities/Role.entity";
import { Repository } from "typeorm";

@Injectable()
export class RoleService {
    constructor(@InjectRepository(Role) private roleRepository: Repository<Role>) { }

    async fetchRoles() {
        return await this.roleRepository.find();
    }

    async findOne(id: number) {
        return await this.roleRepository.findOne({ where: { id: id } });

    }
}