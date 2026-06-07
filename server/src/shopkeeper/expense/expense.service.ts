import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses.query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
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

  private normalizeValue(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private buildUpdateData(payload: UpdateExpenseDto) {
    const data: Prisma.ExpenseUpdateInput = {};

    if (payload.title !== undefined) {
      const title = this.normalizeValue(payload.title);
      if (!title) {
        throw new BadRequestException('title cannot be empty');
      }
      data.title = title;
    }

    if (payload.category !== undefined) {
      data.category = this.normalizeValue(payload.category);
    }

    if (payload.amount !== undefined) {
      if (payload.amount <= 0) {
        throw new BadRequestException('amount must be greater than zero');
      }
      data.amount = payload.amount;
    }

    if (payload.occurredAt !== undefined) {
      data.occurredAt = payload.occurredAt;
    }

    if (payload.paymentMode !== undefined) {
      data.paymentMode = payload.paymentMode;
    }

    if (payload.reference !== undefined) {
      data.reference = this.normalizeValue(payload.reference);
    }

    if (payload.notes !== undefined) {
      data.notes = this.normalizeValue(payload.notes);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return data;
  }

  async createExpense(userId: string, shopId: string, payload: CreateExpenseDto) {
    const shop = await this.ensureShopAccess(userId, shopId);

    return this.prisma.expense.create({
      data: {
        shopId: shop.id,
        title: payload.title.trim(),
        category: this.normalizeValue(payload.category),
        amount: payload.amount,
        occurredAt: payload.occurredAt ?? new Date(),
        paymentMode: payload.paymentMode,
        reference: this.normalizeValue(payload.reference),
        notes: this.normalizeValue(payload.notes),
        createdByUserId: userId,
      },
    });
  }

  async listExpenses(userId: string, shopId: string, query: ListExpensesQueryDto) {
    await this.ensureShopAccess(userId, shopId);

    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from must be before to');
    }

    const includeInactive = query.includeInactive === 'true';

    return this.prisma.expense.findMany({
      where: {
        shopId,
        isActive: includeInactive ? undefined : true,
        category: query.category,
        occurredAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async getExpense(userId: string, shopId: string, expenseId: string) {
    await this.ensureShopAccess(userId, shopId);

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, shopId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async updateExpense(
    userId: string,
    shopId: string,
    expenseId: string,
    payload: UpdateExpenseDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, shopId, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    const data = this.buildUpdateData(payload);

    return this.prisma.expense.update({
      where: { id: existing.id },
      data,
    });
  }

  async archiveExpense(userId: string, shopId: string, expenseId: string) {
    await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, shopId, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    return this.prisma.expense.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }
}
