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
import { CreateDamageDto } from './dto/create-damage.dto';
import { ListDamagesQueryDto } from './dto/list-damages.query.dto';
import { DamageService } from './damage.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/damages')
export class DamageController {
  constructor(private readonly damageService: DamageService) {}

  @Post()
  recordDamage(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateDamageDto,
  ) {
    return this.damageService.recordDamage(user.id, shopId, payload);
  }

  @Get()
  listDamages(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListDamagesQueryDto,
  ) {
    return this.damageService.listDamages(user.id, shopId, query);
  }

  @Get(':damageId')
  getDamage(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('damageId', new ParseUUIDPipe()) damageId: string,
  ) {
    return this.damageService.getDamage(user.id, shopId, damageId);
  }
}
