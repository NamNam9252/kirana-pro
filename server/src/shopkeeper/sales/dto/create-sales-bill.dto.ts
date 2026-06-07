import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaymentMode } from 'src/enum/payment-mode.enum';
import { CreateSalesBillItemDto } from './create-sales-bill-item.dto';

export class CreateSalesBillDto {
  @IsString()
  @ValidateIf((value) => value.paymentMode === PaymentMode.CREDIT)
  @IsNotEmpty()
  @MaxLength(120)
  customerName?: string;

  @IsString()
  @ValidateIf((value) => value.paymentMode === PaymentMode.CREDIT)
  @IsNotEmpty()
  @MaxLength(20)
  customerPhone?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  discountAmount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  taxAmount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  paidAmount?: number;

  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesBillItemDto)
  items: CreateSalesBillItemDto[];
}
