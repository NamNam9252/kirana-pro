import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';
import { ShopkeeperProfileController } from './profile.controller';
import { ShopkeeperProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [ShopkeeperProfileController],
  providers: [ShopkeeperProfileService],
})
export class ShopkeeperProfileModule {}
