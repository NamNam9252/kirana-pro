import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInventoryCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
