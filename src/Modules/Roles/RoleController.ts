import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { RoleService } from './RoleService';


@Controller('roles')
export class RoleController {
    constructor(private roleService: RoleService) { }
    async getRoles(req: Request, res: Response) {
        try {
            const roles = await this.roleService.fetchRoles();
            return roles;
        } catch (error: any) {
            throw new HttpException({ error: `${error} ` }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

}