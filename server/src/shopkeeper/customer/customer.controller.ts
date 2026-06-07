import {
  Body,
  Controller,
  Delete,
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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  createCustomer(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateCustomerDto,
  ) {
    return this.customerService.createCustomer(user.id, shopId, payload);
  }

  @Get()
  listCustomers(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customerService.listCustomers(user.id, shopId, query);
  }

  @Get(':customerId')
  getCustomer(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.customerService.getCustomer(user.id, shopId, customerId);
  }

  @Patch(':customerId')
  updateCustomer(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() payload: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(user.id, shopId, customerId, payload);
  }

  @Delete(':customerId')
  archiveCustomer(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.customerService.archiveCustomer(user.id, shopId, customerId);
  }
}
