import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { InventoryTransactionType } from 'src/enum/inventory-transaction-type.enum';
import { CreateInventoryTransactionItemDto } from './create-inventory-transaction-item.dto';

export class CreateInventoryTransactionDto {
  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryTransactionItemDto)
  items: CreateInventoryTransactionItemDto[];
}
