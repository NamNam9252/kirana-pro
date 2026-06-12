import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  shopId: string;

  @IsEnum(['DELIVERY', 'TAKEAWAY'])
  orderType: 'DELIVERY' | 'TAKEAWAY';

  @IsUUID()
  @IsOptional()
  deliveryAddressId?: string;

  @IsEnum(['CASH', 'UPI', 'CARD', 'OTHER'])
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
