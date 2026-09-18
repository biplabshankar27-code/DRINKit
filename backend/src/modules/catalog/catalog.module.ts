import {forwardRef, Inject, Module, Optional} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../common/shared.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Product, ProductSchema } from './product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    SharedModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
