import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export class ListOrdersQueryDto {
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
}
