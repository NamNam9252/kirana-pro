import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateSalesBillDto } from './dto/create-sales-bill.dto';
import { CreateSalesPaymentDto } from './dto/create-sales-payment.dto';
import { CreditCustomersQueryDto } from './dto/credit-customers.query.dto';
import { ListSalesBillsQueryDto } from './dto/list-sales-bills.query.dto';
import { SalesService } from './sales.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('bills')
  createBill(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateSalesBillDto,
  ) {
    return this.salesService.createBill(user.id, shopId, payload);
  }

  @Get('bills')
  listBills(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListSalesBillsQueryDto,
  ) {
    return this.salesService.listBills(user.id, shopId, query);
  }

  @Get('credit-customers')
  listCreditCustomers(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: CreditCustomersQueryDto,
  ) {
    return this.salesService.listCreditCustomers(user.id, shopId, query);
  }

  @Get('bills/:billId')
  getBill(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('billId', new ParseUUIDPipe()) billId: string,
  ) {
    return this.salesService.getBill(user.id, shopId, billId);
  }

  @Post('bills/:billId/payments')
  recordPayment(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('billId', new ParseUUIDPipe()) billId: string,
    @Body() payload: CreateSalesPaymentDto,
  ) {
    return this.salesService.recordPayment(user.id, shopId, billId, payload);
  }
}
