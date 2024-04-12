
import { IsInt, IsString } from '@nestjs/class-validator'
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from "src/Modules/Users/entities/User.entity";
export class ProductInterface {
  id: number;
  name: string;
  category: string;
  min_qty: number;
  qty: number;
  description: string;
  users: UserEntity;

}



export class createProductDTO {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsString()
  sku: string;
  @ApiProperty()
  @IsString()
  description: string;
  @ApiProperty()
  category: string;
  @ApiProperty()
  @IsInt()
  min_qty: number;
  @ApiProperty()
  qty: number;
  @ApiProperty()
  roles: []
}
