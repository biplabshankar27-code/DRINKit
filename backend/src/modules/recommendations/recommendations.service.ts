import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PrismaService } from '../../common/prisma.service';
import { Product, type ProductDocument } from '../catalog/product.schema';
import { CartService } from '../cart/cart.service';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  async forYou(userId: string, limit = 10): Promise<ProductDocument[]> {
    const flavorTags = await this.topFlavorsForUser(userId);
    const categories = await this.topCategoriesForUser(userId);

    const boostFilter: Record<string, unknown> = { isActive: true };
    if (flavorTags.length > 0 || categories.length > 0) {
      boostFilter.$or = [
        ...(flavorTags.length > 0 ? [{ flavorTags: { $in: flavorTags } }] : []),
        ...(categories.length > 0 ? [{ category: { $in: categories } }] : []),
      ];
    }

    const ranked = await this.productModel
      .find(boostFilter)
      .sort({ popularity: -1, rating: -1 })
      .limit(limit * 2)
      .exec();

    const featured = this.rankByOccasion(ranked, this.currentContext(), limit);

    // backfill with popular items if personal signals are sparse
    if (featured.length < limit) {
      const exclude = new Set(featured.map((p) => String(p._id)));
      const popular = await this.productModel
        .find({ isActive: true, _id: { $nin: [...exclude] } })
        .sort({ popularity: -1 })
        .limit(limit - featured.length)
        .exec();
      return [...featured, ...popular];
    }
    return featured;
  }

  async similar(productId: string, limit = 6): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(productId)) throw new BadRequestException('Invalid product id');
    const base = await this.productModel.findById(productId).exec();
    if (!base) throw new BadRequestException('Product not found');

    const candidates = await this.productModel
      .find({ _id: { $ne: base._id }, isActive: true })
      .limit(200)
      .exec();

    return candidates
      .map((p) => ({ p, score: this.similarity(base, p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.p);
  }

  async cartBasedSuggestions(userId: string, limit = 6): Promise<ProductDocument[]> {
    const cart = await this.cart.getCart(userId);
    if (cart.items.length === 0) return this.popular(limit);
    const ids = new Set(cart.items.map((i) => i.productId));
    const first = cart.items[0];
    const suggestions = await this.productModel
      .find({ _id: { $nin: [...ids] }, isActive: true, $or: [{ category: first.category }, { flavorTags: { $in: [first.category.toLowerCase()] } }] })
      .sort({ popularity: -1 })
      .limit(limit)
      .exec();
    return suggestions;
  }

  async popular(limit = 10): Promise<ProductDocument[]> {
    return this.productModel.find({ isActive: true }).sort({ popularity: -1, rating: -1 }).limit(limit).exec();
  }

  private similarity(a: Product, b: Product): number {
    let score = 0;
    const overlap = a.flavorTags.filter((t) => b.flavorTags.includes(t)).length;
    score += overlap * 2;
    if (a.category === b.category) score += 1.5;
    if (a.origin === b.origin) score += 0.5;
    const priceDiff = Math.abs(a.price - b.price) / Math.max(a.price, b.price, 1);
    score += (1 - priceDiff) * 1.5;
    score += b.popularity / 1000;
    return score;
  }

  private async topFlavorsForUser(userId: string): Promise<string[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { userId } },
      take: 100,
      orderBy: { orderId: 'desc' },
    });
    const counts = new Map<string, number>();
    for (const tag of items.flatMap((i) => i.flavorTags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  }

  private async topCategoriesForUser(userId: string): Promise<string[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { userId } },
      take: 100,
      orderBy: { orderId: 'desc' },
    });
    const counts = new Map<string, number>();
    for (const i of items) counts.set(i.category, (counts.get(i.category) ?? 0) + i.quantity);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  }

  private currentContext(): { time: 'morning' | 'afternoon' | 'evening' | 'night'; weekend: boolean } {
    const hour = new Date().getHours();
    const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
    return { time, weekend: [0, 5, 6].includes(new Date().getDay()) };
  }

  private rankByOccasion(products: ProductDocument[], context: { time: string; weekend: boolean }, limit: number): ProductDocument[] {
    const occasionOf = context.time;
    return [...products]
      .sort((a, b) => {
        const aBoost = (a.occasionTags ?? []).length > 0 ? 0.5 : 0;
        const bBoost = (b.occasionTags ?? []).length > 0 ? 0.5 : 0;
        return bBoost - aBoost;
      })
      .slice(0, limit);
  }
}
