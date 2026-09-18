import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { Product, type ProductDocument } from './product.schema';
import { CATEGORIES, type CategoryDto } from './catalog.constants';

interface CatalogQuery {
  category?: string;
  subCategory?: string;
  flavors?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  origin?: string;
  abvMin?: string;
  abvMax?: string;
  page?: string;
  limit?: string;
  sort?: 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'new';
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async list(query: CatalogQuery): Promise<{ items: ProductDocument[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));

    const filter: Record<string, unknown> = { isActive: true };

    if (query.category) filter.category = query.category;
    if (query.subCategory) filter.subCategory = query.subCategory;
    if (query.origin) filter.origin = query.origin;
    if (query.flavors) {
      const flavors = query.flavors.split(',').map((f) => f.trim()).filter(Boolean);
      if (flavors.length > 0) filter.flavorTags = { $in: flavors };
    }
    if (query.q) {
      const rx = new RegExp(this.escapeRegex(query.q), 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { description: rx }];
    }
    if (query.minPrice || query.maxPrice) {
      filter.price = {
        ...(query.minPrice ? { $gte: Number(query.minPrice) } : {}),
        ...(query.maxPrice ? { $lte: Number(query.maxPrice) } : {}),
      };
    }
    if (query.abvMin || query.abvMax) {
      filter.abv = {
        ...(query.abvMin ? { $gte: Number(query.abvMin) } : {}),
        ...(query.abvMax ? { $lte: Number(query.abvMax) } : {}),
      };
    }

    const sort: Record<string, 1 | -1> =
      query.sort === 'price_asc'
        ? { price: 1 }
        : query.sort === 'price_desc'
          ? { price: -1 }
          : query.sort === 'popular'
            ? { popularity: -1 }
            : query.sort === 'rating'
              ? { rating: -1 }
              : { _id: -1 };

    const [items, total] = await Promise.all([
      this.productModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).exec(),
      this.productModel.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async getById(id: string): Promise<ProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.productModel.findById(id).exec();
  }

  async listCategories(): Promise<CategoryDto[]> {
    const counts = await this.productModel.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));
    return CATEGORIES.map((c) => ({ ...c, productCount: countMap.get(c.name) ?? 0 }) as CategoryDto & { productCount: number });
  }

  async adminCreate(data: Partial<Product>): Promise<ProductDocument> {
    return this.productModel.create(data);
  }

  async adminUpdate(id: string, data: Partial<Product>): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async adminUpdateStock(id: string, stock: number): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndUpdate(id, { stock }, { new: true }).exec();
  }

  async adminDelete(id: string): Promise<void> {
    await this.productModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
