import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../common/shared.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    SharedModule,
    forwardRef(() => CatalogModule),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
