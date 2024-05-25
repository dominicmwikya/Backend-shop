import { ApiProperty } from "@nestjs/swagger";

export class UpdatePurchaseDto {
    @ApiProperty()
    batchNumber : number;
    @ApiProperty()
    quantity: number;
    @ApiProperty()
    sprice : number;
    @ApiProperty()
    product: number
}
