import { TokenDTO } from "src/Dtos/tokePayload";

export interface IBycryptInterface  {
    hash(hashString : string): Promise<string>;
    compare(password: string, hashedPassword: string) : Promise<boolean>;
    saltGenerate(): Promise<string>;
    GenerateToken(data: TokenDTO) : Promise<string>;
    PasswordResetToken(data: any): Promise<string>;
}