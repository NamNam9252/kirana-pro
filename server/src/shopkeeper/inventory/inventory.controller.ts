import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/enum/role.enum';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { Roles } from 'src/security/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { RolesGuard } from 'src/security/guards/roles.guard';
import type { AuthTokenPayload } from 'src/security/jwt/jwt.service';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreateInventoryTransactionPayloadDto } from './dto/create-inventory-transaction-payload.dto';
import { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions.query.dto';
import { ProfitReportQueryDto } from './dto/profit-report.query.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryService } from './inventory.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateInventoryCategoryDto,
  ) {
    return this.inventoryService.createCategory(user.id, shopId, payload);
  }

  @Get('categories')
  listCategories(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
  ) {
    return this.inventoryService.listCategories(user.id, shopId);
  }

  @Get('categories/:categoryId')
  getCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ) {
    return this.inventoryService.getCategory(user.id, shopId, categoryId);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Body() payload: UpdateInventoryCategoryDto,
  ) {
    return this.inventoryService.updateCategory(user.id, shopId, categoryId, payload);
  }

  @Delete('categories/:categoryId')
  archiveCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ) {
    return this.inventoryService.archiveCategory(user.id, shopId, categoryId);
  }

  @Post('categories/:categoryId/items')
  createItemInCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Body() payload: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.id, shopId, {
      ...payload,
      categoryId,
    });
  }

  @Get('categories/:categoryId/items')
  listItemsByCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ) {
    return this.inventoryService.listItemsByCategory(user.id, shopId, categoryId);
  }

  @Post('transactions')
  createTransaction(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateInventoryTransactionDto,
  ) {
    return this.inventoryService.createTransaction(user.id, shopId, payload);
  }

  @Get('transactions')
  listTransactions(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListInventoryTransactionsQueryDto,
  ) {
    return this.inventoryService.listTransactions(user.id, shopId, query);
  }

  @Get('transactions/:transactionId')
  getTransaction(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('transactionId', new ParseUUIDPipe()) transactionId: string,
  ) {
    return this.inventoryService.getTransaction(user.id, shopId, transactionId);
  }

  @Post('damage')
  recordDamage(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateInventoryTransactionPayloadDto,
  ) {
    return this.inventoryService.createDamageTransaction(user.id, shopId, payload);
  }

  @Post('loss')
  recordLoss(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateInventoryTransactionPayloadDto,
  ) {
    return this.inventoryService.createLossTransaction(user.id, shopId, payload);
  }

  @Get('profit')
  getProfit(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ProfitReportQueryDto,
  ) {
    return this.inventoryService.getProfitReport(user.id, shopId, query);
  }

  @Post()
  createItem(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.id, shopId, payload);
  }

  @Get()
  listItems(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
  ) {
    return this.inventoryService.listItems(user.id, shopId);
  }

  @Get(':itemId')
  getItem(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.inventoryService.getItem(user.id, shopId, itemId);
  }

  @Patch(':itemId')
  updateItem(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() payload: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(user.id, shopId, itemId, payload);
  }

  @Delete(':itemId')
  archiveItem(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.inventoryService.archiveItem(user.id, shopId, itemId);
  }
}
