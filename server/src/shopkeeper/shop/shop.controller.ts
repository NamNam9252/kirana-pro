import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopService } from './shop.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('shops')
  createShop(
    @CurrentUser() user: AuthTokenPayload,
    @Body() payload: CreateShopDto,
  ) {
    return this.shopService.createShop(user.id, payload);
  }

  @Get('shops')
  listShops(@CurrentUser() user: AuthTokenPayload) {
    return this.shopService.listShops(user.id);
  }

  @Patch('shops/:shopId')
  updateShop(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: UpdateShopDto,
  ) {
    return this.shopService.updateShop(user.id, shopId, payload);
  }

  @Delete('shops/:shopId')
  archiveShop(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
  ) {
    return this.shopService.archiveShop(user.id, shopId);
  }
}
