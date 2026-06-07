import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt/bcrypt.service';
import { JwtService } from './jwt/jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [BcryptService, JwtService, JwtAuthGuard, RolesGuard],
  exports: [BcryptService, JwtService, JwtAuthGuard, RolesGuard],
})
export class SecurityModule {}
