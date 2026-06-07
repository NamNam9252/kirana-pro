import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { NearbyShopsQueryDto } from './dto/nearby-shops.query.dto';
import { ItemSearchQueryDto } from './dto/item-search.query.dto';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('shops/nearby')
  async nearby(@Query() query: NearbyShopsQueryDto) {
    const dto = plainToInstance(NearbyShopsQueryDto, query);
    await validateOrReject(dto as any);
    const radius = dto.radiusKm ?? 5;
    const limit = dto.limit ?? 50;
    return this.searchService.findNearbyShops(dto.lat, dto.lng, radius, limit);
  }

  @Get('items')
  async items(@Query() query: ItemSearchQueryDto) {
    const dto = plainToInstance(ItemSearchQueryDto, query);
    await validateOrReject(dto as any);
    const radius = dto.radiusKm ?? 5;
    const limit = dto.limit ?? 100;
    const offset = dto.offset ?? 0;
    return this.searchService.searchItemsByLocation(dto.lat, dto.lng, radius, dto.q, dto.category, limit, offset);
  }
}
