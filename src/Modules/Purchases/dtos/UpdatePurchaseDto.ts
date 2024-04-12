import { ApiProperty } from "@nestjs/swagger";

export class UpdatePurchaseDto {
    @ApiProperty()
    price?: number;
    @ApiProperty()
    quantity?: number;
    @ApiProperty()
    sprice?: number;
}
