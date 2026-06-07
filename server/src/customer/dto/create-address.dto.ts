import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCustomerAddressDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  recipientName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine1: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  landmark?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  country?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsOptional()
  longitude?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
