import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class ProfitReportQueryDto {
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  from?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  to?: Date;
}
