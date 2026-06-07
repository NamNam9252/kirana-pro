import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class NearbyShopsQueryDto {
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  radiusKm?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
