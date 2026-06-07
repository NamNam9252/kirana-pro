import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';
import { CustomerAddressController } from './address.controller';
import { CustomerAddressService } from './address.service';
import { CustomerProfileController } from './profile.controller';
import { CustomerProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [CustomerProfileController, CustomerAddressController],
  providers: [CustomerProfileService, CustomerAddressService],
})
export class CustomerModule {}
