import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class ListExpensesQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  from?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  to?: Date;

  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  includeInactive?: string;
}
