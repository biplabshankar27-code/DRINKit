import { IsInt, IsMongoId, Max, Min } from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  productId!: string;

  @IsInt() @Min(1) @Max(20)
  quantity!: number;
}

export class UpdateCartDto {
  @IsMongoId()
  productId!: string;

  @IsInt() @Min(0) @Max(20)
  quantity!: number;
}
