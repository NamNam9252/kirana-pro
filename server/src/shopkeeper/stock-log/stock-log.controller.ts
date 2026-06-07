import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { ListStockLogsQueryDto } from './dto/list-stock-logs.query.dto';
import { StockLogService } from './stock-log.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/stock-logs')
export class StockLogController {
  constructor(private readonly stockLogService: StockLogService) {}

  @Get()
  listLogs(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListStockLogsQueryDto,
  ) {
    return this.stockLogService.listLogs(user.id, shopId, query);
  }

  @Get(':logId')
  getLog(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('logId', new ParseUUIDPipe()) logId: string,
  ) {
    return this.stockLogService.getLog(user.id, shopId, logId);
  }
}
