import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListCustomersQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  q?: string;

  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  includeInactive?: string;
}
