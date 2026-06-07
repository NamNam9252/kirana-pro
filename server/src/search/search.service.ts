import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  private toRadians(deg: number) {
    return (deg * Math.PI) / 180;
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth radius km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private boundingBox(lat: number, lng: number, radiusKm: number) {
    // Approximate conversions
    const latDelta = radiusKm / 111.32; // degrees
    const lngDelta = radiusKm / (111.32 * Math.cos(this.toRadians(lat)));
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  }

  async findNearbyShops(lat: number, lng: number, radiusKm = 5, limit = 50) {
    const bbox = this.boundingBox(lat, lng, radiusKm);

    const shops = await this.prisma.shop.findMany({
      where: {
        latitude: {
          gte: bbox.minLat,
          lte: bbox.maxLat,
        },
        longitude: {
          gte: bbox.minLng,
          lte: bbox.maxLng,
        },
        isActive: true,
      },
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        latitude: true,
        longitude: true,
      },
    });

    const withDistance = shops
      .map((s) => {
        const latS = Number(s.latitude as any);
        const lngS = Number(s.longitude as any);
        const dist = this.haversineDistanceKm(lat, lng, latS, lngS);
        return { ...s, distanceKm: dist };
      })
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return withDistance;
  }

  async searchItemsByLocation(
    lat: number,
    lng: number,
    radiusKm = 5,
    q?: string,
    category?: string,
    limit = 100,
    offset = 0,
  ) {
    const bbox = this.boundingBox(lat, lng, radiusKm);

    const shops = await this.prisma.shop.findMany({
      where: {
        latitude: { gte: bbox.minLat, lte: bbox.maxLat },
        longitude: { gte: bbox.minLng, lte: bbox.maxLng },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        latitude: true,
        longitude: true,
      },
      take: limit,
      skip: offset,
    });

    const shopIds = shops.map((s) => s.id);
    if (shopIds.length === 0) return [];

    const whereClause: any = {
      shopId: { in: shopIds },
      isActive: true,
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        // category name condition below via relation
      ];
    }

    if (category) {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push({ category: { name: { contains: category, mode: 'insensitive' } } });
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        sellingPrice: true,
        quantity: true,
        shopId: true,
        category: { select: { id: true, name: true } },
      },
      take: 500,
    });

    const shopMap = new Map<string, any>();
    for (const s of shops) {
      const latS = Number(s.latitude as any);
      const lngS = Number(s.longitude as any);
      const dist = this.haversineDistanceKm(lat, lng, latS, lngS);
      shopMap.set(s.id, { shop: s, distanceKm: dist, items: [] as any[] });
    }

    for (const it of items) {
      const entry = shopMap.get(it.shopId);
      if (!entry) continue;
      if (entry.distanceKm > radiusKm) continue;
      entry.items.push({
        id: it.id,
        name: it.name,
        description: it.description,
        sku: it.sku,
        sellingPrice: it.sellingPrice,
        quantity: it.quantity,
        category: it.category,
      });
    }

    const result = Array.from(shopMap.values())
      .filter((s) => s.items.length > 0)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return result;
  }
}
