import { Module, forwardRef } from '@nestjs/common';
import { SharedModule } from '../../common/shared.module';
import { CartModule } from '../cart/cart.module';
import { CatalogModule } from '../catalog/catalog.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [SharedModule, forwardRef(() => CartModule), forwardRef(() => CatalogModule), NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
