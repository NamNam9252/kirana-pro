import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDamageDto } from './dto/create-damage.dto';
import { ListDamagesQueryDto } from './dto/list-damages.query.dto';
import { InventoryTransactionType } from 'src/enum/inventory-transaction-type.enum';
import { StockChangeReason } from 'src/enum/stock-change-reason.enum';

@Injectable()
export class DamageService {
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

  async recordDamage(userId: string, shopId: string, payload: CreateDamageDto) {
    const shop = await this.ensureShopAccess(userId, shopId);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: payload.inventoryItemId, shopId: shop.id, isActive: true },
      });

      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      if (item.quantity - payload.quantity < 0) {
        throw new BadRequestException('Insufficient stock for damage');
      }

      const unitCost = payload.unitCost ?? (item.costPrice ? Number(item.costPrice) : undefined);
      if (unitCost === undefined) {
        throw new BadRequestException('unitCost is required when item has no costPrice');
      }

      const totalCost = unitCost * payload.quantity;
      const occurredAt = payload.occurredAt ?? new Date();

      const transaction = await tx.inventoryTransaction.create({
        data: {
          shopId: shop.id,
          type: InventoryTransactionType.DAMAGE,
          reference: 'DAMAGE',
          notes: payload.reason,
          createdByUserId: userId,
          items: {
            create: {
              inventoryItemId: item.id,
              quantity: payload.quantity,
              unitCost,
            },
          },
        },
      });

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity - payload.quantity },
      });

      const stockLog = await tx.stockLog.create({
        data: {
          shopId: shop.id,
          inventoryItemId: item.id,
          changeQuantity: -payload.quantity,
          previousQuantity: item.quantity,
          newQuantity: item.quantity - payload.quantity,
          reason: StockChangeReason.DAMAGE,
          inventoryTransactionId: transaction.id,
          notes: payload.reason,
          createdByUserId: userId,
        },
      });

      return tx.damageRecord.create({
        data: {
          shopId: shop.id,
          inventoryItemId: item.id,
          quantity: payload.quantity,
          unitCost,
          totalCost,
          reason: payload.reason,
          occurredAt,
          createdByUserId: userId,
          transactionId: transaction.id,
          stockLogId: stockLog.id,
        },
      });
    });
  }

  async listDamages(userId: string, shopId: string, query: ListDamagesQueryDto) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    return this.prisma.damageRecord.findMany({
      where: {
        shopId,
        inventoryItemId: query.inventoryItemId,
        occurredAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      orderBy: { occurredAt: 'desc' },
      include: {
        inventoryItem: { select: { id: true, name: true } },
      },
    });
  }

  async getDamage(userId: string, shopId: string, damageId: string) {
    await this.ensureShopAccess(userId, shopId);

    const damage = await this.prisma.damageRecord.findFirst({
      where: { id: damageId, shopId },
      include: {
        inventoryItem: { select: { id: true, name: true } },
        transaction: true,
        stockLog: true,
      },
    });

    if (!damage) {
      throw new NotFoundException('Damage record not found');
    }

    return damage;
  }
}
