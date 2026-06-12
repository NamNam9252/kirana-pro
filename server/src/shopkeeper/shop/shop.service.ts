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

  /**
   * Sync the PostGIS `location` geometry column from lat/lng.
   * Called after creating or updating a shop when coordinates are provided.
   * Silently skips if the PostGIS column doesn't exist (graceful degradation).
   */
  private async syncLocation(shopId: string, latitude: number, longitude: number) {
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Shop" SET "location" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE "id" = $3`,
        longitude,
        latitude,
        shopId,
      );
    } catch (error) {
      console.warn('syncLocation: PostGIS column not available, skipping geometry sync');
    }
  }

  async createShop(userId: string, payload: CreateShopDto) {
    const shopkeeper = await this.ensureShopkeeper(userId);
    const shop = await this.prisma.shop.create({
      data: {
        ...payload,
        shopkeeperId: shopkeeper.id,
      },
    });

    if (payload.latitude != null && payload.longitude != null) {
      await this.syncLocation(shop.id, payload.latitude, payload.longitude);
    }

    return shop;
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

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: payload,
    });

    // Re-sync PostGIS geometry if coordinates were updated
    const lat = payload.latitude ?? Number(existing.latitude);
    const lng = payload.longitude ?? Number(existing.longitude);
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      await this.syncLocation(shopId, lat, lng);
    }

    return updated;
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
