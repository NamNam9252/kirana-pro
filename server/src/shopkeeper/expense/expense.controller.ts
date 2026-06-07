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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses.query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPKEEPER)
@Controller('shopkeeper/shops/:shopId/expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  createExpense(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() payload: CreateExpenseDto,
  ) {
    return this.expenseService.createExpense(user.id, shopId, payload);
  }

  @Get()
  listExpenses(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Query() query: ListExpensesQueryDto,
  ) {
    return this.expenseService.listExpenses(user.id, shopId, query);
  }

  @Get(':expenseId')
  getExpense(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
  ) {
    return this.expenseService.getExpense(user.id, shopId, expenseId);
  }

  @Patch(':expenseId')
  updateExpense(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
    @Body() payload: UpdateExpenseDto,
  ) {
    return this.expenseService.updateExpense(user.id, shopId, expenseId, payload);
  }

  @Delete(':expenseId')
  archiveExpense(
    @CurrentUser() user: AuthTokenPayload,
    @Param('shopId', new ParseUUIDPipe()) shopId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
  ) {
    return this.expenseService.archiveExpense(user.id, shopId, expenseId);
  }
}
