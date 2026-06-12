import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { CustomerOrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('customer/orders')
export class CustomerOrderController {
  constructor(private readonly orderService: CustomerOrderService) {}

  @Post()
  placeOrder(
    @CurrentUser() user: AuthTokenPayload,
    @Body() payload: CreateOrderDto,
  ) {
    return this.orderService.placeOrder(user.id, user.name, user.email, payload);
  }

  @Get()
  listOrders(
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.orderService.listOrders(user.id, query);
  }

  @Get(':orderId')
  getOrder(
    @CurrentUser() user: AuthTokenPayload,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ) {
    return this.orderService.getOrder(user.id, orderId);
  }

  @Patch(':orderId/cancel')
  cancelOrder(
    @CurrentUser() user: AuthTokenPayload,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() payload: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(user.id, orderId, payload.reason);
  }
}
