import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, type WishlistDocument } from './wishlist.schema';

const MAX_ITEMS = 200;

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  async getWishlist(userId: string): Promise<{ productIds: string[] }> {
    const wishlist = await this.ensureWishlist(userId);
    return { productIds: wishlist.productIds };
  }

  async addProduct(userId: string, productId: string): Promise<{ productIds: string[] }> {
    const wishlist = await this.ensureWishlist(userId);
    if (!wishlist.productIds.includes(productId)) {
      if (wishlist.productIds.length >= MAX_ITEMS) return { productIds: wishlist.productIds };
      wishlist.productIds.push(productId);
      await wishlist.save();
    }
    return { productIds: wishlist.productIds };
  }

  async removeProduct(userId: string, productId: string): Promise<{ productIds: string[] }> {
    const wishlist = await this.ensureWishlist(userId);
    if (wishlist.productIds.includes(productId)) {
      wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
      await wishlist.save();
    }
    return { productIds: wishlist.productIds };
  }

  async clearAll(userId: string): Promise<{ productIds: string[] }> {
    const wishlist = await this.ensureWishlist(userId);
    wishlist.productIds = [];
    await wishlist.save();
    return { productIds: [] };
  }

  private async ensureWishlist(userId: string): Promise<WishlistDocument> {
    const found = await this.wishlistModel.findOne({ userId });
    if (found) return found;
    return this.wishlistModel.create({ userId, productIds: [] });
  }
}
