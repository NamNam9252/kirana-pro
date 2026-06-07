import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerProfileDto } from './dto/update-profile.dto';

@Injectable()
export class CustomerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private buildCreateData(payload: UpdateCustomerProfileDto) {
    return {
      fullName: this.normalizeValue(payload.fullName),
      phone: this.normalizeValue(payload.phone),
      alternatePhone: this.normalizeValue(payload.alternatePhone),
      avatarUrl: this.normalizeValue(payload.avatarUrl),
    };
  }

  private normalizeValue(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private buildUpdateData(payload: UpdateCustomerProfileDto) {
    const data: Prisma.CustomerProfileUpdateInput = {};

    if (payload.fullName !== undefined) {
      data.fullName = this.normalizeValue(payload.fullName);
    }

    if (payload.phone !== undefined) {
      const phone = this.normalizeValue(payload.phone);
      if (!phone) {
        throw new BadRequestException('phone cannot be empty');
      }
      data.phone = phone;
    }

    if (payload.alternatePhone !== undefined) {
      data.alternatePhone = this.normalizeValue(payload.alternatePhone);
    }

    if (payload.avatarUrl !== undefined) {
      data.avatarUrl = this.normalizeValue(payload.avatarUrl);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return data;
  }

  async getProfile(userId: string) {
    return this.prisma.customerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        user: { connect: { id: userId } },
      },
    });
  }

  async updateProfile(userId: string, payload: UpdateCustomerProfileDto) {
    const data = this.buildUpdateData(payload);
    const createData = this.buildCreateData(payload);

    return this.prisma.customerProfile.upsert({
      where: { userId },
      update: data,
      create: {
        user: { connect: { id: userId } },
        ...createData,
      },
    });
  }
}
