import { UserEntity } from "src/Entities/User.entity";

export interface CreateLoginEntityInput {
    refreshTokens: string;
    expiresAt: Date;
    user: UserEntity;
}