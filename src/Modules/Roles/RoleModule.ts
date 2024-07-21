import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from 'src/entities/Role.entity';
import { RoleController } from './RoleController';
import { RoleService } from './RoleService';

@Module({
    imports: [TypeOrmModule.forFeature([Role])],
    providers: [RoleService],
    controllers: [RoleController],
    exports: [RoleService]
})

export class RoleModule { }