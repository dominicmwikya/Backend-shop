import { UserEntity } from "src/Entities/User.entity";
export interface UserInterface {
   getUserByName(username : string):Promise<UserEntity>;
   updateLastLogin(username: string) : Promise<void>;
   updateRefreshToken(id : any, refreshToken: string) : Promise<void>;
}

