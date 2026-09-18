import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CatalogService } from '../catalog/catalog.service';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly catalog: CatalogService) {}

  @Post('check-availability')
  async checkAvailability(@Body() body: { productIds: string[] }) {
    if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
      throw new BadRequestException('productIds required');
    }
    const results: { productId: string; available: boolean; stock: number }[] = [];
    for (const id of body.productIds.slice(0, 100)) {
      const product = await this.catalog.getById(id);
      results.push({ productId: id, available: !!product && product.stock > 0, stock: product?.stock ?? 0 });
    }
    return { results };
  }
}
