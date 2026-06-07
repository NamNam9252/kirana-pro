import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreateInventoryTransactionItemDto } from './dto/create-inventory-transaction-item.dto';
import { CreateInventoryTransactionPayloadDto } from './dto/create-inventory-transaction-payload.dto';
import { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions.query.dto';
import { ProfitReportQueryDto } from './dto/profit-report.query.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryTransactionType } from 'src/enum/inventory-transaction-type.enum';
import { StockChangeReason } from 'src/enum/stock-change-reason.enum';

type NormalizedTransactionItem = {
  inventoryItemId: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
};

@Injectable()
export class InventoryService {
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

  private async ensureCategoryAccess(userId: string, shopId: string, categoryId: string) {
    await this.ensureShopAccess(userId, shopId);

    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id: categoryId, shopId, isActive: true },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private normalizeTransactionItems(items: CreateInventoryTransactionItemDto[]) {
    const aggregated = new Map<string, NormalizedTransactionItem>();

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero');
      }

      const existing = aggregated.get(item.inventoryItemId);
      if (!existing) {
        aggregated.set(item.inventoryItemId, { ...item });
        continue;
      }

      if (
        (existing.unitCost ?? null) !== (item.unitCost ?? null) ||
        (existing.unitPrice ?? null) !== (item.unitPrice ?? null)
      ) {
        throw new BadRequestException('Duplicate item has mismatched pricing');
      }

      existing.quantity += item.quantity;
    }

    return Array.from(aggregated.values());
  }

  private getQuantityDelta(type: InventoryTransactionType, quantity: number) {
    switch (type) {
      case InventoryTransactionType.PURCHASE:
      case InventoryTransactionType.ADJUSTMENT_IN:
        return quantity;
      case InventoryTransactionType.SALE:
      case InventoryTransactionType.DAMAGE:
      case InventoryTransactionType.LOSS:
      case InventoryTransactionType.ADJUSTMENT_OUT:
        return -quantity;
      default:
        return 0;
    }
  }

  private mapStockReason(type: InventoryTransactionType): StockChangeReason {
    switch (type) {
      case InventoryTransactionType.PURCHASE:
        return StockChangeReason.PURCHASE;
      case InventoryTransactionType.SALE:
        return StockChangeReason.SALE;
      case InventoryTransactionType.DAMAGE:
        return StockChangeReason.DAMAGE;
      case InventoryTransactionType.LOSS:
        return StockChangeReason.LOSS;
      case InventoryTransactionType.ADJUSTMENT_IN:
        return StockChangeReason.ADJUSTMENT_IN;
      case InventoryTransactionType.ADJUSTMENT_OUT:
        return StockChangeReason.ADJUSTMENT_OUT;
      default:
        return StockChangeReason.MANUAL;
    }
  }

  private ensurePricing(type: InventoryTransactionType, item: NormalizedTransactionItem) {
    if (type === InventoryTransactionType.SALE) {
      if (item.unitPrice === undefined) {
        throw new BadRequestException('unitPrice is required for sales');
      }
      return;
    }

    if (
      type === InventoryTransactionType.PURCHASE ||
      type === InventoryTransactionType.DAMAGE ||
      type === InventoryTransactionType.LOSS
    ) {
      if (item.unitCost === undefined) {
        throw new BadRequestException('unitCost is required for this transaction type');
      }
    }
  }

  async createCategory(
    userId: string,
    shopId: string,
    payload: CreateInventoryCategoryDto,
  ) {
    const shop = await this.ensureShopAccess(userId, shopId);

    return this.prisma.inventoryCategory.create({
      data: {
        ...payload,
        shopId: shop.id,
      },
    });
  }

  async listCategories(userId: string, shopId: string) {
    const shop = await this.ensureShopAccess(userId, shopId);

    return this.prisma.inventoryCategory.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCategory(userId: string, shopId: string, categoryId: string) {
    await this.ensureShopAccess(userId, shopId);

    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id: categoryId, shopId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(
    userId: string,
    shopId: string,
    categoryId: string,
    payload: UpdateInventoryCategoryDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.inventoryCategory.findFirst({
      where: { id: categoryId, shopId, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.inventoryCategory.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  async archiveCategory(userId: string, shopId: string, categoryId: string) {
    await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.inventoryCategory.findFirst({
      where: { id: categoryId, shopId, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.inventoryCategory.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }

  async createItem(userId: string, shopId: string, payload: CreateInventoryItemDto) {
    const shop = await this.ensureShopAccess(userId, shopId);

    if (payload.categoryId) {
      await this.ensureCategoryAccess(userId, shopId, payload.categoryId);
    }

    return this.prisma.inventoryItem.create({
      data: {
        ...payload,
        shopId: shop.id,
      },
    });
  }

  async listItems(userId: string, shopId: string) {
    const shop = await this.ensureShopAccess(userId, shopId);

    return this.prisma.inventoryItem.findMany({
      where: { shopId: shop.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async listItemsByCategory(userId: string, shopId: string, categoryId: string) {
    await this.ensureCategoryAccess(userId, shopId, categoryId);

    return this.prisma.inventoryItem.findMany({
      where: { shopId, categoryId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async getItem(userId: string, shopId: string, itemId: string) {
    const shop = await this.ensureShopAccess(userId, shopId);

    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, shopId: shop.id, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async updateItem(
    userId: string,
    shopId: string,
    itemId: string,
    payload: UpdateInventoryItemDto,
  ) {
    const shop = await this.ensureShopAccess(userId, shopId);

    if (payload.categoryId) {
      await this.ensureCategoryAccess(userId, shopId, payload.categoryId);
    }

    const existing = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, shopId: shop.id, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.prisma.inventoryItem.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  async archiveItem(userId: string, shopId: string, itemId: string) {
    const shop = await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, shopId: shop.id, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.prisma.inventoryItem.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }

  async createTransaction(
    userId: string,
    shopId: string,
    payload: CreateInventoryTransactionDto,
  ) {
    const shop = await this.ensureShopAccess(userId, shopId);
    const normalizedItems = this.normalizeTransactionItems(payload.items);

    for (const item of normalizedItems) {
      this.ensurePricing(payload.type, item);
    }

    const inventoryIds = normalizedItems.map((item) => item.inventoryItemId);

    return this.prisma.$transaction(async (tx) => {
      const inventoryItems = await tx.inventoryItem.findMany({
        where: {
          id: { in: inventoryIds },
          shopId: shop.id,
          isActive: true,
        },
      });

      if (inventoryItems.length !== inventoryIds.length) {
        throw new NotFoundException('One or more inventory items were not found');
      }

      const inventoryById = new Map(
        inventoryItems.map((item) => [item.id, item]),
      );

      for (const item of normalizedItems) {
        const existing = inventoryById.get(item.inventoryItemId);
        if (!existing) {
          throw new NotFoundException('Inventory item not found');
        }

        const delta = this.getQuantityDelta(payload.type, item.quantity);
        if (existing.quantity + delta < 0) {
          throw new BadRequestException('Insufficient stock for transaction');
        }
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          shopId: shop.id,
          type: payload.type,
          reference: payload.reference,
          notes: payload.notes,
          createdByUserId: userId,
          items: {
            create: normalizedItems.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of normalizedItems) {
        const existing = inventoryById.get(item.inventoryItemId);
        if (!existing) {
          continue;
        }

        const delta = this.getQuantityDelta(payload.type, item.quantity);
        if (delta === 0) {
          continue;
        }

        await tx.inventoryItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + delta },
        });
      }

      const reason = this.mapStockReason(payload.type);
      const logEntries: Prisma.StockLogCreateManyInput[] = normalizedItems.flatMap(
        (item) => {
          const existing = inventoryById.get(item.inventoryItemId);
          if (!existing) {
            return [];
          }

          const delta = this.getQuantityDelta(payload.type, item.quantity);
          if (delta === 0) {
            return [];
          }

          return [
            {
              shopId: shop.id,
              inventoryItemId: existing.id,
              changeQuantity: delta,
              previousQuantity: existing.quantity,
              newQuantity: existing.quantity + delta,
              reason,
              inventoryTransactionId: transaction.id,
              notes: payload.notes,
              createdByUserId: userId,
            },
          ];
        },
      );

      if (logEntries.length > 0) {
        await tx.stockLog.createMany({ data: logEntries });
      }

      return transaction;
    });
  }

  async listTransactions(
    userId: string,
    shopId: string,
    query: ListInventoryTransactionsQueryDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    return this.prisma.inventoryTransaction.findMany({
      where: {
        shopId,
        type: query.type,
        createdAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      include: {
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransaction(userId: string, shopId: string, transactionId: string) {
    await this.ensureShopAccess(userId, shopId);

    const transaction = await this.prisma.inventoryTransaction.findFirst({
      where: { id: transactionId, shopId },
      include: {
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async createDamageTransaction(
    userId: string,
    shopId: string,
    payload: CreateInventoryTransactionPayloadDto,
  ) {
    return this.createTransaction(userId, shopId, {
      ...payload,
      type: InventoryTransactionType.DAMAGE,
    });
  }

  async createLossTransaction(
    userId: string,
    shopId: string,
    payload: CreateInventoryTransactionPayloadDto,
  ) {
    return this.createTransaction(userId, shopId, {
      ...payload,
      type: InventoryTransactionType.LOSS,
    });
  }

  async getProfitReport(userId: string, shopId: string, query: ProfitReportQueryDto) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        shopId,
        type: {
          in: [
            InventoryTransactionType.SALE,
            InventoryTransactionType.PURCHASE,
            InventoryTransactionType.DAMAGE,
            InventoryTransactionType.LOSS,
          ],
        },
        createdAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      include: { items: true },
    });

    let salesRevenue = 0;
    let purchaseCost = 0;
    let damageLossCost = 0;

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const quantity = item.quantity ?? 0;
        const unitCost = Number(item.unitCost ?? 0);
        const unitPrice = Number(item.unitPrice ?? 0);

        if (transaction.type === InventoryTransactionType.SALE) {
          salesRevenue += quantity * unitPrice;
        } else if (transaction.type === InventoryTransactionType.PURCHASE) {
          purchaseCost += quantity * unitCost;
        } else if (
          transaction.type === InventoryTransactionType.DAMAGE ||
          transaction.type === InventoryTransactionType.LOSS
        ) {
          damageLossCost += quantity * unitCost;
        }
      }
    }

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      salesRevenue,
      purchaseCost,
      damageLossCost,
      profit: salesRevenue - purchaseCost - damageLossCost,
    };
  }
}
