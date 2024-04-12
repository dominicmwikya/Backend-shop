import { ApiProperty } from "@nestjs/swagger";

export class PurchaseDto {
    @ApiProperty()
    price: number;
    @ApiProperty()
    quantity: number;
    @ApiProperty()
    sprice: number;
    // @ApiProperty()
    // productId : number
}