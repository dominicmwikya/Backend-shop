import { IsNumberString } from "@nestjs/class-validator";

export class FindOneParams {
    @IsNumberString()
    id: number
}