import { UserEntity } from "../entities/User.entity";

export interface CreateLoginEntityInput {
    refreshTokens: string;
    expiresAt: Date;
    user: UserEntity;
}