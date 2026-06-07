import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaymentMode } from 'src/enum/payment-mode.enum';

export class CreateSalesPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

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
