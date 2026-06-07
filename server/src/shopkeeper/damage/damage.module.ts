import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecurityModule } from 'src/security/security.module';
import { DamageController } from './damage.controller';
import { DamageService } from './damage.service';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [DamageController],
  providers: [DamageService],
})
export class DamageModule {}
