import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class ListShopOrdersQueryDto {
  @IsEnum(['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'])
  @IsOptional()
  status?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  from?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  to?: Date;
}
