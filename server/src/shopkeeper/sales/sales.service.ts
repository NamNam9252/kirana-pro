import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalesBillDto } from './dto/create-sales-bill.dto';
import { CreateSalesPaymentDto } from './dto/create-sales-payment.dto';
import { CreditCustomersQueryDto } from './dto/credit-customers.query.dto';
import { ListSalesBillsQueryDto } from './dto/list-sales-bills.query.dto';
import { PaymentMode } from 'src/enum/payment-mode.enum';
import { PaymentStatus } from 'src/enum/payment-status.enum';
import { InventoryTransactionType } from 'src/enum/inventory-transaction-type.enum';
import { StockChangeReason } from 'src/enum/stock-change-reason.enum';

type CreditCustomerSummary = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  billsCount: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  lastBillAt: Date;
  nextDueDate?: Date | null;
  hasContact: boolean;
};

type NormalizedSalesItem = {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
};

@Injectable()
export class SalesService {
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

  private normalizeItems(items: CreateSalesBillDto['items']) {
    const aggregated = new Map<string, NormalizedSalesItem>();

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero');
      }

      if (item.unitPrice < 0) {
        throw new BadRequestException('unitPrice cannot be negative');
      }

      const existing = aggregated.get(item.inventoryItemId);
      if (!existing) {
        aggregated.set(item.inventoryItemId, { ...item });
        continue;
      }

      if (existing.unitPrice !== item.unitPrice) {
        throw new BadRequestException('Duplicate item has mismatched unitPrice');
      }

      existing.quantity += item.quantity;
    }

    return Array.from(aggregated.values());
  }

  private calculateTotals(
    items: NormalizedSalesItem[],
    discountAmount: number,
    taxAmount: number,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const total = subtotal - discountAmount + taxAmount;
    if (total < 0) {
      throw new BadRequestException('Total cannot be negative');
    }

    return { subtotal, total };
  }

  private resolvePaymentStatus(total: number, paidAmount: number) {
    if (paidAmount <= 0) {
      return PaymentStatus.UNPAID;
    }

    if (paidAmount < total) {
      return PaymentStatus.PARTIAL;
    }

    return PaymentStatus.PAID;
  }

  private generateBillNumber() {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${stamp}-${random}`;
  }

  private normalizeCustomerInput(payload: CreateSalesBillDto) {
    const name = payload.customerName?.trim();
    const phone = payload.customerPhone?.trim();
    const email = payload.customerEmail?.trim();

    return {
      name: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
    };
  }

  async createBill(userId: string, shopId: string, payload: CreateSalesBillDto) {
    const shop = await this.ensureShopAccess(userId, shopId);
    const normalizedItems = this.normalizeItems(payload.items);
    const discountAmount = payload.discountAmount ?? 0;
    const taxAmount = payload.taxAmount ?? 0;

    if (discountAmount < 0 || taxAmount < 0) {
      throw new BadRequestException('Discount and tax cannot be negative');
    }

    const { subtotal, total } = this.calculateTotals(
      normalizedItems,
      discountAmount,
      taxAmount,
    );

    const paidAmount = payload.paidAmount ?? 0;
    if (paidAmount < 0) {
      throw new BadRequestException('paidAmount cannot be negative');
    }
    if (paidAmount > total) {
      throw new BadRequestException('paidAmount cannot exceed total');
    }

    const status = this.resolvePaymentStatus(total, paidAmount);

    if (
      payload.paymentMode !== PaymentMode.CREDIT &&
      status !== PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Non-credit sales must be fully paid at creation',
      );
    }

    if (
      payload.paymentMode === PaymentMode.CREDIT &&
      status !== PaymentStatus.PAID &&
      !payload.dueDate
    ) {
      throw new BadRequestException('dueDate is required for credit sales');
    }

    const customerInput = this.normalizeCustomerInput(payload);

    if (
      payload.paymentMode === PaymentMode.CREDIT &&
      status !== PaymentStatus.PAID &&
      (!customerInput.name || !customerInput.phone)
    ) {
      throw new BadRequestException(
        'customerName and customerPhone are required for unpaid credit bills',
      );
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

        if (existing.quantity - item.quantity < 0) {
          throw new BadRequestException('Insufficient stock for sale');
        }
      }

      let customerId: string | undefined;
      if (customerInput.phone && customerInput.name) {
        const customer = await tx.customer.upsert({
          where: {
            shopId_phone: {
              shopId: shop.id,
              phone: customerInput.phone,
            },
          },
          update: {
            name: customerInput.name,
            email: customerInput.email,
            isActive: true,
          },
          create: {
            shopId: shop.id,
            name: customerInput.name,
            phone: customerInput.phone,
            email: customerInput.email,
          },
          select: { id: true },
        });

        customerId = customer.id;
      }

      const billNumber = this.generateBillNumber();
      const transaction = await tx.inventoryTransaction.create({
        data: {
          shopId: shop.id,
          type: InventoryTransactionType.SALE,
          reference: billNumber,
          notes: payload.notes,
          createdByUserId: userId,
          items: {
            create: normalizedItems.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      for (const item of normalizedItems) {
        const existing = inventoryById.get(item.inventoryItemId);
        if (!existing) {
          continue;
        }

        await tx.inventoryItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity - item.quantity },
        });
      }

      const bill = await tx.salesBill.create({
        data: {
          shopId: shop.id,
          billNumber,
          customerId,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail,
          notes: payload.notes,
          subtotalAmount: subtotal,
          discountAmount,
          taxAmount,
          totalAmount: total,
          paidAmount,
          status,
          paymentMode: payload.paymentMode,
          dueDate: payload.dueDate,
          createdByUserId: userId,
          transactionId: transaction.id,
          items: {
            create: normalizedItems.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice,
            })),
          },
          payments:
            paidAmount > 0
              ? {
                  create: {
                    amount: paidAmount,
                    paymentMode: payload.paymentMode,
                    reference: billNumber,
                    notes: 'Initial payment',
                    createdByUserId: userId,
                  },
                }
              : undefined,
        },
        include: {
          items: true,
          payments: true,
        },
      });

      const logEntries: Prisma.StockLogCreateManyInput[] = normalizedItems.flatMap(
        (item) => {
          const existing = inventoryById.get(item.inventoryItemId);
          if (!existing) {
            return [];
          }

          return [
            {
              shopId: shop.id,
              inventoryItemId: existing.id,
              changeQuantity: -item.quantity,
              previousQuantity: existing.quantity,
              newQuantity: existing.quantity - item.quantity,
              reason: StockChangeReason.SALE,
              inventoryTransactionId: transaction.id,
              salesBillId: bill.id,
              notes: payload.notes,
              createdByUserId: userId,
            },
          ];
        },
      );

      if (logEntries.length > 0) {
        await tx.stockLog.createMany({ data: logEntries });
      }

      return bill;
    });
  }

  async listBills(userId: string, shopId: string, query: ListSalesBillsQueryDto) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    return this.prisma.salesBill.findMany({
      where: {
        shopId,
        status: query.status,
        paymentMode: query.paymentMode,
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
        items: true,
      },
    });
  }

  async listCreditCustomers(
    userId: string,
    shopId: string,
    query: CreditCustomersQueryDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    const bills = await this.prisma.salesBill.findMany({
      where: {
        shopId,
        paymentMode: PaymentMode.CREDIT,
        status: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
        createdAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      select: {
        id: true,
        billNumber: true,
        customerId: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        createdAt: true,
      },
    });

    const customers = new Map<string, CreditCustomerSummary>();

    for (const bill of bills) {
      const total = Number(bill.totalAmount);
      const paid = Number(bill.paidAmount);
      const outstanding = total - paid;

      if (outstanding <= 0) {
        continue;
      }

      const hasPhone = !!bill.customerPhone;
      const hasEmail = !!bill.customerEmail;
      const hasContact = hasPhone || hasEmail;

      const key = bill.customerId
        ? `customer:${bill.customerId}`
        : hasPhone
          ? `phone:${bill.customerPhone}`
          : hasEmail
            ? `email:${bill.customerEmail}`
            : bill.customerName
              ? `name:${bill.customerName}`
              : `bill:${bill.id}`;

      const existing = customers.get(key);
      if (!existing) {
        customers.set(key, {
          customerName: bill.customerName ?? undefined,
          customerPhone: bill.customerPhone ?? undefined,
          customerEmail: bill.customerEmail ?? undefined,
          billsCount: 1,
          totalBilled: total,
          totalPaid: paid,
          totalOutstanding: outstanding,
          lastBillAt: bill.createdAt,
          nextDueDate: bill.dueDate,
          hasContact,
        });
        continue;
      }

      existing.billsCount += 1;
      existing.totalBilled += total;
      existing.totalPaid += paid;
      existing.totalOutstanding += outstanding;
      if (bill.createdAt > existing.lastBillAt) {
        existing.lastBillAt = bill.createdAt;
      }
      if (bill.dueDate) {
        if (!existing.nextDueDate || bill.dueDate < existing.nextDueDate) {
          existing.nextDueDate = bill.dueDate;
        }
      }
      if (!existing.customerName && bill.customerName) {
        existing.customerName = bill.customerName;
      }
      if (!existing.customerPhone && bill.customerPhone) {
        existing.customerPhone = bill.customerPhone;
      }
      if (!existing.customerEmail && bill.customerEmail) {
        existing.customerEmail = bill.customerEmail;
      }
      existing.hasContact = existing.hasContact || hasContact;
    }

    let results = Array.from(customers.values());

    if (query.minOutstanding !== undefined) {
      results = results.filter(
        (customer) => customer.totalOutstanding >= query.minOutstanding!,
      );
    }

    results.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return {
      totalCustomers: results.length,
      totalOutstanding: results.reduce(
        (sum, customer) => sum + customer.totalOutstanding,
        0,
      ),
      customers: results,
    };
  }

  async getBill(userId: string, shopId: string, billId: string) {
    await this.ensureShopAccess(userId, shopId);

    const bill = await this.prisma.salesBill.findFirst({
      where: { id: billId, shopId },
      include: {
        items: {
          include: { inventoryItem: { select: { id: true, name: true } } },
        },
        payments: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return bill;
  }

  async recordPayment(
    userId: string,
    shopId: string,
    billId: string,
    payload: CreateSalesPaymentDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.salesBill.findFirst({
        where: { id: billId, shopId },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      const totalAmount = Number(bill.totalAmount);
      const currentPaid = Number(bill.paidAmount);
      const newPaid = currentPaid + payload.amount;

      if (newPaid > totalAmount) {
        throw new BadRequestException('Payment exceeds total amount');
      }

      const status = this.resolvePaymentStatus(totalAmount, newPaid);

      const payment = await tx.salesPayment.create({
        data: {
          billId: bill.id,
          amount: payload.amount,
          paymentMode: payload.paymentMode ?? bill.paymentMode,
          reference: payload.reference,
          notes: payload.notes,
          createdByUserId: userId,
        },
      });

      await tx.salesBill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaid,
          status,
          dueDate: status === PaymentStatus.PAID ? null : bill.dueDate,
        },
      });

      return payment;
    });
  }
}
