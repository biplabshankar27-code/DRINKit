import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId()
  addressId!: string;

  @IsOptional() @IsString() @MaxLength(255)
  notes?: string;
}
