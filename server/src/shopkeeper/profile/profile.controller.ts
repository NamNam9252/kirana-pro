import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { UpdateShopkeeperProfileDto } from './dto/update-profile.dto';
import { ShopkeeperProfileService } from './profile.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/profile')
export class ShopkeeperProfileController {
  constructor(private readonly profileService: ShopkeeperProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthTokenPayload) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthTokenPayload,
    @Body() payload: UpdateShopkeeperProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, payload);
  }
}
