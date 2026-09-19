import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WishlistService } from './wishlist.service';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser('sub') userId: string) {
    return this.wishlist.getWishlist(userId);
  }

  @Post(':productId')
  addProduct(@CurrentUser('sub') userId: string, @Param('productId') productId: string) {
    return this.wishlist.addProduct(userId, productId);
  }

  @Delete()
  clearAll(@CurrentUser('sub') userId: string) {
    return this.wishlist.clearAll(userId);
  }

  @Delete(':productId')
  removeProduct(@CurrentUser('sub') userId: string, @Param('productId') productId: string) {
    return this.wishlist.removeProduct(userId, productId);
  }
}
