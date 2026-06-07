import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ItemSearchQueryDto {
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

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  limit?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  offset?: number;
}
