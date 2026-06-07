import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { SearchModule } from './search/search.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopkeeperModule } from './shopkeeper/shopkeeper.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ShopkeeperModule, CustomerModule, SearchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
