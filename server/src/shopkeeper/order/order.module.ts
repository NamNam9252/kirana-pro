import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';
import { ShopkeeperOrderController } from './order.controller';
import { ShopkeeperOrderService } from './order.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [ShopkeeperOrderController],
  providers: [ShopkeeperOrderService],
})
export class ShopkeeperOrderModule {}
