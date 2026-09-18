import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './common/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    SharedModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    InventoryModule,
    RecommendationsModule,
    AiAssistantModule,
    PaymentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
