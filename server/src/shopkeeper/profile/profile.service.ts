import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateShopkeeperProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ShopkeeperProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureShopkeeper(userId: string) {
    return this.prisma.shopkeeper.upsert({
      where: { userId },
      update: {},
      create: {
        user: { connect: { id: userId } },
      },
    });
  }

  async getProfile(userId: string) {
    return this.ensureShopkeeper(userId);
  }

  async updateProfile(userId: string, payload: UpdateShopkeeperProfileDto) {
    return this.prisma.shopkeeper.upsert({
      where: { userId },
      update: payload,
      create: {
        user: { connect: { id: userId } },
        ...payload,
      },
    });
  }
}
