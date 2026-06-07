import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StockChangeReason } from 'src/enum/stock-change-reason.enum';

export class ListStockLogsQueryDto {
  @IsUUID()
  @IsOptional()
  inventoryItemId?: string;

  @IsEnum(StockChangeReason)
  @IsOptional()
  reason?: StockChangeReason;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  from?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  to?: Date;
}
