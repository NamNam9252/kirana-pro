import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { UpdateCustomerProfileDto } from './dto/update-profile.dto';
import { CustomerProfileService } from './profile.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('customer/profile')
export class CustomerProfileController {
  constructor(private readonly profileService: CustomerProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthTokenPayload) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthTokenPayload,
    @Body() payload: UpdateCustomerProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, payload);
  }
}
