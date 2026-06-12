import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { ShopkeeperOrderService } from './order.service';
import { ListShopOrdersQueryDto } from './dto/list-shop-orders.query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/orders')
export class ShopkeeperOrderController {
  constructor(private readonly orderService: ShopkeeperOrderService) {}

  @Get()
  listOrders(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListShopOrdersQueryDto,
  ) {
    return this.orderService.listOrders(user.id, shopId, query);
  }

  @Get('stats')
  getStats(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
  ) {
    return this.orderService.getOrderStats(user.id, shopId);
  }

  @Get(':orderId')
  getOrder(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ) {
    return this.orderService.getOrder(user.id, shopId, orderId);
  }

  @Patch(':orderId/status')
  updateStatus(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() payload: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(user.id, shopId, orderId, payload);
  }
}
