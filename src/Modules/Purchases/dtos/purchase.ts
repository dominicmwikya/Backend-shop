import { ApiProperty } from "@nestjs/swagger";

export class purchasedto {
    @ApiProperty()
    price: number;
    @ApiProperty()
    quantity: number;
    @ApiProperty()
    sprice: number;
    @ApiProperty()
    productId : number
    @ApiProperty()
    userId: number
}