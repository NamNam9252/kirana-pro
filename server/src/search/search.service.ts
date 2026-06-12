import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NearbyShopRow {
  id: string;
  name: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all active shops within `radiusKm` of the given coordinates
   * using PostGIS ST_DWithin for spatial filtering and ST_Distance for sorting.
   */
  async findNearbyShops(lat: number, lng: number, radiusKm = 5, limit = 50): Promise<NearbyShopRow[]> {
    const radiusMeters = radiusKm * 1000;

    const shops = await this.prisma.$queryRawUnsafe<NearbyShopRow[]>(
      `
      SELECT
        "id", "name", "phone", "addressLine1", "addressLine2",
        "latitude", "longitude",
        ST_Distance(
          "location"::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000.0 AS "distanceKm"
      FROM "Shop"
      WHERE "isActive" = true
        AND "location" IS NOT NULL
        AND ST_DWithin(
          "location"::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      ORDER BY "distanceKm" ASC
      LIMIT $4
      `,
      lng,
      lat,
      radiusMeters,
      limit,
    );

    return shops;
  }

  /**
   * Search inventory items across shops near the given coordinates.
   * First finds nearby shops via PostGIS, then queries their inventory via Prisma.
   */
  async searchItemsByLocation(
    lat: number,
    lng: number,
    radiusKm = 5,
    q?: string,
    category?: string,
    limit = 100,
    offset = 0,
  ) {
    // Step 1: Get nearby shops with PostGIS
    const nearbyShops = await this.findNearbyShops(lat, lng, radiusKm, 200);
    const shopIds = nearbyShops.map((s) => s.id);
    if (shopIds.length === 0) return [];

    // Step 2: Build inventory filter
    const whereClause: any = {
      shopId: { in: shopIds },
      isActive: true,
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push({ category: { name: { contains: category, mode: 'insensitive' } } });
    }

    // Step 3: Fetch matching inventory items
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
      take: limit,
      skip: offset,
    });

    // Step 4: Group items by shop with distance info
    const shopMap = new Map<string, { shop: NearbyShopRow; items: any[] }>();
    for (const s of nearbyShops) {
      shopMap.set(s.id, { shop: s, items: [] });
    }

    for (const item of items) {
      const entry = shopMap.get(item.shopId);
      if (!entry) continue;
      entry.items.push({
        id: item.id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        category: item.category,
      });
    }

    return Array.from(shopMap.values())
      .filter((s) => s.items.length > 0)
      .sort((a, b) => a.shop.distanceKm - b.shop.distanceKm);
  }
}
