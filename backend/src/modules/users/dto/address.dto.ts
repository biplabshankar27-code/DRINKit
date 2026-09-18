import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString() @MinLength(1) @MaxLength(32)
  label!: string;

  @IsString() @MinLength(1) @MaxLength(255)
  line1!: string;

  @IsOptional() @IsString() @MaxLength(255)
  line2?: string;

  @IsString() @MinLength(1) @MaxLength(64)
  city!: string;

  @IsString() @MinLength(1) @MaxLength(64)
  state!: string;

  @IsString() @MinLength(3) @MaxLength(12)
  postalCode!: string;

  @IsOptional() @IsNumber()
  lat?: number;

  @IsOptional() @IsNumber()
  lng?: number;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;
}
