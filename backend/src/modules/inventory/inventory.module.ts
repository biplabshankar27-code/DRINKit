import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [CatalogModule],
  controllers: [InventoryController],
})
export class InventoryModule {}
