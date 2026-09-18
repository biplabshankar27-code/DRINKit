import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CartService } from '../cart/cart.service';
import { CatalogService } from '../catalog/catalog.service';
import { TrackingGateway } from '../notifications/tracking.gateway';
import { CreateOrderDto } from './dto/create-order.dto';

export const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ETA_BY_STATUS: Record<string, number> = {
  pending: 45,
  confirmed: 35,
  packed: 25,
  out_for_delivery: 10,
  delivered: 0,
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly catalog: CatalogService,
    private readonly tracking: TrackingGateway,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cart = await this.cart.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
    if (!address) throw new BadRequestException('Address not found');

    for (const line of cart.items) {
      const product = await this.catalog.getById(line.productId);
      if (!product || product.stock < line.quantity) {
        throw new BadRequestException(`${line.name} is out of stock`);
      }
    }

    const tax = Math.round(cart.itemsTotal * 0.05 * 100) / 100;
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'pending',
        itemsTotal: cart.itemsTotal,
        deliveryFee: cart.deliveryFee,
        tax,
        grandTotal: cart.itemsTotal + cart.deliveryFee + tax,
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          lat: address.lat,
          lng: address.lng,
        },
        etaMinutes: ETA_BY_STATUS.pending,
        notes: dto.notes,
        items: {
          create: cart.items.map((line) => ({
            productId: line.productId,
            name: line.name,
            image: line.image,
            price: line.price,
            quantity: line.quantity,
            category: line.category,
            flavorTags: [],
          })),
        },
      },
      include: { items: true },
    });

    for (const line of cart.items) {
      await this.catalog.adminUpdateStock(line.productId, (line.stock ?? 0) - line.quantity).catch(() => undefined);
    }

    await this.cart.clear(userId);
    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async get(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus, deliveryAgent?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status, etaMinutes: ETA_BY_STATUS[status] ?? order.etaMinutes, deliveryAgent },
    });

    this.tracking.emitOrderStatus(order.userId, { orderId, status, etaMinutes: updated.etaMinutes ?? undefined });
    return updated;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('Order can no longer be cancelled');
    }
    return this.prisma.order.update({ where: { id: orderId }, data: { status: 'cancelled' } });
  }
}
