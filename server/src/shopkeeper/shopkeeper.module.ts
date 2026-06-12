import { Module } from '@nestjs/common';
import { ShopModule } from './shop/shop.module';
import { ShopkeeperProfileModule } from './profile/profile.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { CustomerModule } from './customer/customer.module';
import { StockLogModule } from './stock-log/stock-log.module';
import { ExpenseModule } from './expense/expense.module';
import { DamageModule } from './damage/damage.module';
import { ShopkeeperOrderModule } from './order/order.module';

@Module({
  imports: [
    ShopModule,
    ShopkeeperProfileModule,
    InventoryModule,
    SalesModule,
    CustomerModule,
    StockLogModule,
    ExpenseModule,
    DamageModule,
    ShopkeeperOrderModule,
  ],
})
export class ShopkeeperModule {}

