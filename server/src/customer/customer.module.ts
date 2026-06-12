import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';
import { CustomerAddressController } from './address.controller';
import { CustomerAddressService } from './address.service';
import { CustomerOrderController } from './order.controller';
import { CustomerOrderService } from './order.service';
import { CustomerProfileController } from './profile.controller';
import { CustomerProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [CustomerProfileController, CustomerAddressController, CustomerOrderController],
  providers: [CustomerProfileService, CustomerAddressService, CustomerOrderService],
})
export class CustomerModule {}
