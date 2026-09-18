import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  addressId!: string;

  @IsOptional() @IsString() @MaxLength(255)
  notes?: string;
}
