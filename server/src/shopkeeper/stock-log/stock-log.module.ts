import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';
import { StockLogController } from './stock-log.controller';
import { StockLogService } from './stock-log.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [StockLogController],
  providers: [StockLogService],
})
export class StockLogModule {}
