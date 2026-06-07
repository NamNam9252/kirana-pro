import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMode } from 'src/enum/payment-mode.enum';

export class UpdateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @Type(() => Date)
  @IsOptional()
  occurredAt?: Date;

  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
