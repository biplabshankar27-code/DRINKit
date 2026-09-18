import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';

const adminGuards = [JwtAuthGuard, RolesGuard];

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products')
  list(@Query() query: Record<string, string>) {
    return this.catalog.list(query);
  }

  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  @Get('products/by-ids')
  async findByIds(@Query('ids') ids: string | undefined) {
    const list = (ids ?? '').split(',').map((id) => id.trim()).filter(Boolean);
    return this.catalog.findByIds(list);
  }

  @Get('products/:id')
  async getById(@Param('id') id: string) {
    const product = await this.catalog.getById(id);
    if (!product) throw new BadRequestException('Product not found');
    return product;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/products')
  create(@Body() body: Record<string, unknown>) {
    return this.catalog.adminCreate(body as never);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/products/:id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.catalog.adminUpdate(id, body as never);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/products/:id/stock')
  updateStock(@Param('id') id: string, @Body() body: { stock: number }) {
    return this.catalog.adminUpdateStock(id, Number(body.stock));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/products/:id')
  delete(@Param('id') id: string) {
    return this.catalog.adminDelete(id);
  }
}
