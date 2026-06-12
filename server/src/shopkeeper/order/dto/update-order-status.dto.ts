import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED'])
  status: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejectionReason?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  estimatedMinutes?: number;
}
