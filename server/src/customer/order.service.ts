import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { OrderStatus } from 'src/enum/order-status.enum';
import { OrderType } from 'src/enum/order-type.enum';
import { PaymentMode } from 'src/enum/payment-mode.enum';

@Injectable()
export class CustomerOrderService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber() {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${stamp}-${random}`;
  }

  private async ensureProfile(userId: string) {
    return this.prisma.customerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        user: { connect: { id: userId } },
      },
    });
  }

  async placeOrder(userId: string, userName: string, userEmail: string, payload: CreateOrderDto) {
    const profile = await this.ensureProfile(userId);

    // Validate shop exists and is active
    const shop = await this.prisma.shop.findFirst({
      where: { id: payload.shopId, isActive: true },
      select: { id: true, name: true },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found or inactive');
    }

    // For DELIVERY orders, validate address
    let addressSnapshot: {
      deliveryAddress: string;
      deliveryCity: string;
      deliveryState: string;
      deliveryPostalCode: string;
      deliveryLatitude?: number;
      deliveryLongitude?: number;
    } | null = null;

    if (payload.orderType === 'DELIVERY') {
      if (!payload.deliveryAddressId) {
        throw new BadRequestException('deliveryAddressId is required for DELIVERY orders');
      }

      const address = await this.prisma.customerAddress.findFirst({
        where: {
          id: payload.deliveryAddressId,
          profileId: profile.id,
          isActive: true,
        },
      });
      if (!address) {
        throw new NotFoundException('Delivery address not found');
      }

      addressSnapshot = {
        deliveryAddress: [address.addressLine1, address.addressLine2, address.landmark]
          .filter(Boolean)
          .join(', '),
        deliveryCity: address.city,
        deliveryState: address.state,
        deliveryPostalCode: address.postalCode,
        deliveryLatitude: address.latitude ? Number(address.latitude) : undefined,
        deliveryLongitude: address.longitude ? Number(address.longitude) : undefined,
      };
    }

    // Aggregate duplicate items
    const itemMap = new Map<string, number>();
    for (const item of payload.items) {
      const current = itemMap.get(item.inventoryItemId) ?? 0;
      itemMap.set(item.inventoryItemId, current + item.quantity);
    }
    const aggregatedItems = Array.from(itemMap.entries()).map(([id, qty]) => ({
      inventoryItemId: id,
      quantity: qty,
    }));

    const inventoryIds = aggregatedItems.map((i) => i.inventoryItemId);

    return this.prisma.$transaction(async (tx) => {
      // Fetch and validate all inventory items
      const inventoryItems = await tx.inventoryItem.findMany({
        where: {
          id: { in: inventoryIds },
          shopId: shop.id,
          isActive: true,
        },
      });

      if (inventoryItems.length !== inventoryIds.length) {
        throw new NotFoundException('One or more items not found in this shop');
      }

      const inventoryById = new Map(inventoryItems.map((i) => [i.id, i]));

      // Validate stock availability
      for (const item of aggregatedItems) {
        const inv = inventoryById.get(item.inventoryItemId)!;
        if (inv.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${inv.name}": available ${inv.quantity}, requested ${item.quantity}`,
          );
        }
        if (!inv.sellingPrice) {
          throw new BadRequestException(`Item "${inv.name}" has no selling price set`);
        }
      }

      // Calculate totals
      const orderItems = aggregatedItems.map((item) => {
        const inv = inventoryById.get(item.inventoryItemId)!;
        const unitPrice = Number(inv.sellingPrice);
        const lineTotal = unitPrice * item.quantity;
        return {
          inventoryItemId: item.inventoryItemId,
          itemName: inv.name,
          itemDescription: inv.description,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        };
      });

      const subtotalAmount = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
      const totalAmount = subtotalAmount; // delivery fee, discount, tax can be added later

      const orderNumber = this.generateOrderNumber();

      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          shopId: shop.id,
          customerProfileId: profile.id,
          customerUserId: userId,
          deliveryAddressId: payload.deliveryAddressId,
          orderType: payload.orderType as OrderType,
          status: OrderStatus.PLACED,
          customerName: profile.fullName ?? userName,
          customerPhone: payload.customerPhone ?? profile.phone,
          customerEmail: userEmail,
          subtotalAmount,
          totalAmount,
          paymentMode: (payload.paymentMode as PaymentMode) ?? PaymentMode.CASH,
          notes: payload.notes,
          ...(addressSnapshot ?? {}),
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    });
  }

  async listOrders(userId: string, query: ListOrdersQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const where: any = { customerUserId: userId };
    if (query.status) {
      where.status = query.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          items: true,
          shop: {
            select: { id: true, name: true, phone: true, addressLine1: true, city: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, limit, offset };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerUserId: userId },
      include: {
        items: true,
        shop: {
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerUserId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Customer can only cancel PLACED or CONFIRMED orders
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PLACED, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot cancel order in "${order.status}" status. Only PLACED or CONFIRMED orders can be cancelled.`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: { items: true },
    });
  }
}
