// import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { JwtService } from "@nestjs/jwt";





// @Injectable()
// export class RoleGuard implements CanActivate {
//     constructor(private reflector : Reflector, private jwtService: JwtService) {}

//     async canActivate(context: ExecutionContext) {

//         const payload = await this.jwtService.verifyAsync('', {
//             secret : process.env.SECRET_KEY_API_KEY
//         })
//         const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
//             context.getHandler(),
//             context.getClass(),
//         ]); 

//         if (!requiredRoles) {
//             return true;
//         }

//     }
// }