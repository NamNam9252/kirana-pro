import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListShopOrdersQueryDto } from './dto/list-shop-orders.query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from 'src/enum/order-status.enum';
import { StockChangeReason } from 'src/enum/stock-change-reason.enum';
import { InventoryTransactionType } from 'src/enum/inventory-transaction-type.enum';

// Valid status transitions the shopkeeper can make
const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['PREPARING', 'REJECTED'],
  PREPARING: ['READY'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
};

@Injectable()
export class ShopkeeperOrderService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureShopAccess(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, isActive: true, shopkeeper: { userId } },
      select: { id: true },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async listOrders(userId: string, shopId: string, query: ListShopOrdersQueryDto) {
    await this.ensureShopAccess(userId, shopId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const where: any = { shopId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, limit, offset };
  }

  async getOrder(userId: string, shopId: string, orderId: string) {
    await this.ensureShopAccess(userId, shopId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shopId },
      include: {
        items: true,
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    userId: string,
    shopId: string,
    orderId: string,
    payload: UpdateOrderStatusDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shopId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(payload.status)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${payload.status}"`,
      );
    }

    if (payload.status === 'REJECTED' && !payload.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting an order');
    }

    // Build update data
    const updateData: any = {
      status: payload.status as OrderStatus,
    };

    const now = new Date();

    switch (payload.status) {
      case 'CONFIRMED':
        updateData.confirmedAt = now;
        if (payload.estimatedMinutes) {
          updateData.estimatedReadyAt = new Date(now.getTime() + payload.estimatedMinutes * 60000);
        }
        break;
      case 'PREPARING':
        updateData.preparedAt = now;
        break;
      case 'READY':
        updateData.readyAt = now;
        break;
      case 'DELIVERED':
        updateData.deliveredAt = now;
        updateData.paymentStatus = 'PAID';
        break;
      case 'REJECTED':
        updateData.rejectionReason = payload.rejectionReason;
        updateData.cancelledAt = now;
        break;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });

      // Deduct stock when order is CONFIRMED
      if (payload.status === 'CONFIRMED') {
        await this.deductInventory(tx, userId, shopId, order);
      }

      return updated;
    });
  }

  /**
   * Deduct inventory and create stock logs + inventory transaction when order is confirmed.
   */
  private async deductInventory(
    tx: Prisma.TransactionClient,
    userId: string,
    shopId: string,
    order: any,
  ) {
    const inventoryIds = order.items.map((i: any) => i.inventoryItemId);
    const inventoryItems = await tx.inventoryItem.findMany({
      where: { id: { in: inventoryIds }, shopId },
    });
    const inventoryById = new Map(inventoryItems.map((i) => [i.id, i]));

    // Validate stock again inside transaction
    for (const item of order.items) {
      const inv = inventoryById.get(item.inventoryItemId);
      if (!inv) {
        throw new NotFoundException(`Inventory item "${item.itemName}" no longer exists`);
      }
      if (inv.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.itemName}": available ${inv.quantity}, requested ${item.quantity}`,
        );
      }
    }

    // Create inventory transaction
    const transaction = await tx.inventoryTransaction.create({
      data: {
        shopId,
        type: InventoryTransactionType.SALE,
        reference: order.orderNumber,
        notes: `Online order ${order.orderNumber}`,
        createdByUserId: userId,
        items: {
          create: order.items.map((item: any) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
    });

    // Deduct stock and create stock logs
    const stockLogs: Prisma.StockLogCreateManyInput[] = [];

    for (const item of order.items) {
      const inv = inventoryById.get(item.inventoryItemId)!;
      const newQty = inv.quantity - item.quantity;

      await tx.inventoryItem.update({
        where: { id: inv.id },
        data: { quantity: newQty },
      });

      stockLogs.push({
        shopId,
        inventoryItemId: inv.id,
        changeQuantity: -item.quantity,
        previousQuantity: inv.quantity,
        newQuantity: newQty,
        reason: StockChangeReason.SALE,
        inventoryTransactionId: transaction.id,
        notes: `Order ${order.orderNumber}`,
        createdByUserId: userId,
      });
    }

    if (stockLogs.length > 0) {
      await tx.stockLog.createMany({ data: stockLogs });
    }
  }

  /**
   * Get order statistics for a shop dashboard.
   */
  async getOrderStats(userId: string, shopId: string) {
    await this.ensureShopAccess(userId, shopId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      statusCounts,
    ] = await Promise.all([
      this.prisma.order.count({ where: { shopId } }),
      this.prisma.order.count({
        where: { shopId, createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: { shopId, status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { shopId },
        _count: true,
      }),
    ]);

    return {
      totalOrders,
      todayOrders,
      pendingOrders,
      byStatus: statusCounts.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count }),
        {} as Record<string, number>,
      ),
    };
  }
}
