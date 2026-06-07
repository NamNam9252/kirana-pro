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
import { CustomerAddressService } from './address.service';
import { CreateCustomerAddressDto } from './dto/create-address.dto';
import { ListCustomerAddressesQueryDto } from './dto/list-addresses.query.dto';
import { UpdateCustomerAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('customer/addresses')
export class CustomerAddressController {
  constructor(private readonly addressService: CustomerAddressService) {}

  @Post()
  createAddress(
    @CurrentUser() user: AuthTokenPayload,
    @Body() payload: CreateCustomerAddressDto,
  ) {
    return this.addressService.createAddress(user.id, payload);
  }

  @Get()
  listAddresses(
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ListCustomerAddressesQueryDto,
  ) {
    return this.addressService.listAddresses(user.id, query);
  }

  @Get(':addressId')
  getAddress(
    @CurrentUser() user: AuthTokenPayload,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ) {
    return this.addressService.getAddress(user.id, addressId);
  }

  @Patch(':addressId')
  updateAddress(
    @CurrentUser() user: AuthTokenPayload,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() payload: UpdateCustomerAddressDto,
  ) {
    return this.addressService.updateAddress(user.id, addressId, payload);
  }

  @Delete(':addressId')
  archiveAddress(
    @CurrentUser() user: AuthTokenPayload,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ) {
    return this.addressService.archiveAddress(user.id, addressId);
  }
}
