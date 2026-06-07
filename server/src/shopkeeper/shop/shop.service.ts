import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopService {
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

  async createShop(userId: string, payload: CreateShopDto) {
    const shopkeeper = await this.ensureShopkeeper(userId);
    return this.prisma.shop.create({
      data: {
        ...payload,
        shopkeeperId: shopkeeper.id,
      },
    });
  }

  listShops(userId: string) {
    return this.prisma.shop.findMany({
      where: { shopkeeper: { userId }, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateShop(userId: string, shopId: string, payload: UpdateShopDto) {
    const existing = await this.prisma.shop.findFirst({
      where: { id: shopId, shopkeeper: { userId } },
    });
    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    return this.prisma.shop.update({
      where: { id: shopId },
      data: payload,
    });
  }

  async archiveShop(userId: string, shopId: string) {
    const existing = await this.prisma.shop.findFirst({
      where: { id: shopId, shopkeeper: { userId } },
    });
    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    return this.prisma.shop.update({
      where: { id: shopId },
      data: { isActive: false },
    });
  }
}
