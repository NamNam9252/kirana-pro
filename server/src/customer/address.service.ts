import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerAddressDto } from './dto/create-address.dto';
import { ListCustomerAddressesQueryDto } from './dto/list-addresses.query.dto';
import { UpdateCustomerAddressDto } from './dto/update-address.dto';

@Injectable()
export class CustomerAddressService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeValue(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
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

  private buildUpdateData(payload: UpdateCustomerAddressDto) {
    const data: Prisma.CustomerAddressUpdateInput = {};

    if (payload.label !== undefined) {
      data.label = this.normalizeValue(payload.label);
    }

    if (payload.recipientName !== undefined) {
      data.recipientName = this.normalizeValue(payload.recipientName);
    }

    if (payload.phone !== undefined) {
      data.phone = this.normalizeValue(payload.phone);
    }

    if (payload.addressLine1 !== undefined) {
      const addressLine1 = this.normalizeValue(payload.addressLine1);
      if (!addressLine1) {
        throw new BadRequestException('addressLine1 cannot be empty');
      }
      data.addressLine1 = addressLine1;
    }

    if (payload.addressLine2 !== undefined) {
      data.addressLine2 = this.normalizeValue(payload.addressLine2);
    }

    if (payload.landmark !== undefined) {
      data.landmark = this.normalizeValue(payload.landmark);
    }

    if (payload.city !== undefined) {
      const city = this.normalizeValue(payload.city);
      if (!city) {
        throw new BadRequestException('city cannot be empty');
      }
      data.city = city;
    }

    if (payload.state !== undefined) {
      const state = this.normalizeValue(payload.state);
      if (!state) {
        throw new BadRequestException('state cannot be empty');
      }
      data.state = state;
    }

    if (payload.postalCode !== undefined) {
      const postalCode = this.normalizeValue(payload.postalCode);
      if (!postalCode) {
        throw new BadRequestException('postalCode cannot be empty');
      }
      data.postalCode = postalCode;
    }

    if (payload.country !== undefined) {
      data.country = this.normalizeValue(payload.country);
    }

    if (payload.latitude !== undefined) {
      data.latitude = payload.latitude;
    }

    if (payload.longitude !== undefined) {
      data.longitude = payload.longitude;
    }

    if (payload.isDefault !== undefined) {
      data.isDefault = payload.isDefault;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return data;
  }

  async createAddress(userId: string, payload: CreateCustomerAddressDto) {
    const profile = await this.ensureProfile(userId);

    const existingDefault = await this.prisma.customerAddress.findFirst({
      where: { profileId: profile.id, isActive: true, isDefault: true },
      select: { id: true },
    });

    const shouldBeDefault = payload.isDefault ?? !existingDefault;

    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.customerAddress.updateMany({
          where: { profileId: profile.id },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          profileId: profile.id,
          label: this.normalizeValue(payload.label),
          recipientName: this.normalizeValue(payload.recipientName),
          phone: this.normalizeValue(payload.phone),
          addressLine1: payload.addressLine1.trim(),
          addressLine2: this.normalizeValue(payload.addressLine2),
          landmark: this.normalizeValue(payload.landmark),
          city: payload.city.trim(),
          state: payload.state.trim(),
          postalCode: payload.postalCode.trim(),
          country: this.normalizeValue(payload.country),
          latitude: payload.latitude,
          longitude: payload.longitude,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async listAddresses(userId: string, query: ListCustomerAddressesQueryDto) {
    const profile = await this.ensureProfile(userId);
    const includeInactive = query.includeInactive === 'true';

    return this.prisma.customerAddress.findMany({
      where: {
        profileId: profile.id,
        isActive: includeInactive ? undefined : true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAddress(userId: string, addressId: string) {
    const profile = await this.ensureProfile(userId);

    const address = await this.prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        profileId: profile.id,
        isActive: true,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    payload: UpdateCustomerAddressDto,
  ) {
    const profile = await this.ensureProfile(userId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, profileId: profile.id, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    const data = this.buildUpdateData(payload);

    return this.prisma.$transaction(async (tx) => {
      if (payload.isDefault === true) {
        await tx.customerAddress.updateMany({
          where: { profileId: profile.id },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.update({
        where: { id: existing.id },
        data,
      });
    });
  }

  async archiveAddress(userId: string, addressId: string) {
    const profile = await this.ensureProfile(userId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, profileId: profile.id, isActive: true },
      select: { id: true, isDefault: true },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.customerAddress.update({
      where: { id: existing.id },
      data: { isActive: false, isDefault: false },
    });
  }
}
