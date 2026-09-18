import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@CurrentUser('sub') userId: string) {
    return this.cart.getCart(userId);
  }

  @Post('items')
  addItem(@CurrentUser('sub') userId: string, @Body() dto: AddToCartDto) {
    return this.cart.addItem(userId, dto);
  }

  @Patch('items')
  updateItem(@CurrentUser('sub') userId: string, @Body() dto: UpdateCartDto) {
    return this.cart.updateItem(userId, dto);
  }

  @Delete('items')
  clear(@CurrentUser('sub') userId: string) {
    return this.cart.clear(userId);
  }
}
