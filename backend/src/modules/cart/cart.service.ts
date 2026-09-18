import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogService } from '../catalog/catalog.service';
import { type Product, type ProductDocument } from '../catalog/product.schema';
import { Cart, type CartDocument, type CartLine } from './cart.schema';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';

export interface CartTotals {
  items: CartLine[];
  itemsTotal: number;
  deliveryFee: number;
  grandTotal: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    private readonly catalog: CatalogService,
  ) {}

  async getCart(userId: string): Promise<CartTotals> {
    return this.totals(await this.ensureCart(userId));
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartTotals> {
    const product = await this.mustGetProduct(dto.productId);
    if (product.stock < dto.quantity) {
      throw new BadRequestException(`Only ${product.stock} left in stock`);
    }
    const cart = await this.ensureCart(userId);
    const line = cart.items.find((i) => i.productId === dto.productId);
    if (line) {
      line.quantity = Math.min(20, line.quantity + dto.quantity);
      if (line.quantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} left in stock`);
      }
      line.stock = product.stock;
    } else {
      cart.items.push(this.toLine(product, dto.quantity));
    }
    await cart.save();
    return this.totals(cart);
  }

  async updateItem(userId: string, dto: UpdateCartDto): Promise<CartTotals> {
    const cart = await this.ensureCart(userId);
    const line = cart.items.find((i) => i.productId === dto.productId);
    if (!line) throw new NotFoundException('Item not in cart');

    if (dto.quantity === 0) {
      cart.items = cart.items.filter((i) => i.productId !== dto.productId);
    } else {
      if (dto.quantity > line.stock) throw new BadRequestException(`Only ${line.stock} left in stock`);
      line.quantity = dto.quantity;
    }
    await cart.save();
    return this.totals(cart);
  }

  async clear(userId: string): Promise<CartTotals> {
    const cart = await this.ensureCart(userId);
    cart.items = [];
    await cart.save();
    return this.totals(cart);
  }

  async ensureCart(userId: string): Promise<CartDocument> {
    const found = await this.cartModel.findOne({ userId });
    if (found) return found;
    return this.cartModel.create({ userId, items: [] });
  }

  private toLine(product: ProductDocument, quantity: number): CartLine {
    return {
      productId: String(product._id),
      name: product.name,
      image: product.image,
      price: product.price,
      category: product.category,
      quantity,
      stock: product.stock,
    };
  }

  private totals(cart: CartDocument): CartTotals {
    const itemsTotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = itemsTotal > 999 ? 0 : 49;
    return { items: cart.items, itemsTotal, deliveryFee, grandTotal: itemsTotal + deliveryFee };
  }

  private async mustGetProduct(productId: string): Promise<ProductDocument> {
    const product = await this.catalog.getById(productId);
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    return product;
  }
}
