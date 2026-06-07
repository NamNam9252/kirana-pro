import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListStockLogsQueryDto } from './dto/list-stock-logs.query.dto';

@Injectable()
export class StockLogService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureShopAccess(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        id: shopId,
        isActive: true,
        shopkeeper: { userId },
      },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async listLogs(userId: string, shopId: string, query: ListStockLogsQueryDto) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    return this.prisma.stockLog.findMany({
      where: {
        shopId,
        inventoryItemId: query.inventoryItemId,
        reason: query.reason,
        createdAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryItem: { select: { id: true, name: true } },
      },
    });
  }

  async getLog(userId: string, shopId: string, logId: string) {
    await this.ensureShopAccess(userId, shopId);

    const log = await this.prisma.stockLog.findFirst({
      where: { id: logId, shopId },
      include: {
        inventoryItem: { select: { id: true, name: true } },
      },
    });

    if (!log) {
      throw new NotFoundException('Stock log not found');
    }

    return log;
  }
}
