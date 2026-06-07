import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
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

  private buildUpdateData(payload: UpdateCustomerDto) {
    const data: Prisma.CustomerUpdateInput = {};

    if (payload.name !== undefined) {
      const name = this.normalizeValue(payload.name);
      if (!name) {
        throw new BadRequestException('name cannot be empty');
      }
      data.name = name;
    }

    if (payload.phone !== undefined) {
      const phone = this.normalizeValue(payload.phone);
      if (!phone) {
        throw new BadRequestException('phone cannot be empty');
      }
      data.phone = phone;
    }

    if (payload.email !== undefined) {
      const email = this.normalizeValue(payload.email);
      data.email = email;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return data;
  }

  async createCustomer(userId: string, shopId: string, payload: CreateCustomerDto) {
    const shop = await this.ensureShopAccess(userId, shopId);
    const name = this.normalizeValue(payload.name);
    const phone = this.normalizeValue(payload.phone);
    const email = this.normalizeValue(payload.email);

    if (!name || !phone) {
      throw new BadRequestException('name and phone are required');
    }

    try {
      return await this.prisma.customer.create({
        data: {
          shopId: shop.id,
          name,
          phone,
          email,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Customer phone already exists');
        }
      }
      throw error;
    }
  }

  async listCustomers(userId: string, shopId: string, query: ListCustomersQueryDto) {
    const shop = await this.ensureShopAccess(userId, shopId);
    const includeInactive = query.includeInactive === 'true';
    const search = this.normalizeValue(query.q);

    const where: Prisma.CustomerWhereInput = {
      shopId: shop.id,
      isActive: includeInactive ? undefined : true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getCustomer(userId: string, shopId: string, customerId: string) {
    await this.ensureShopAccess(userId, shopId);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        shopId,
        isActive: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateCustomer(
    userId: string,
    shopId: string,
    customerId: string,
    payload: UpdateCustomerDto,
  ) {
    await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        shopId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    const data = this.buildUpdateData(payload);

    try {
      return await this.prisma.customer.update({
        where: { id: existing.id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Customer phone already exists');
        }
      }
      throw error;
    }
  }

  async archiveCustomer(userId: string, shopId: string, customerId: string) {
    await this.ensureShopAccess(userId, shopId);

    const existing = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        shopId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }
}
