import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { appConfig } from '../../config/configuration';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPayment(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== 'pending') throw new BadRequestException('Order is not awaiting payment');

    const cfg = appConfig();

    // Razorpay integration point — verified flow requires valid keys.
    // MVP uses a deterministic mock reference the client can "verify".
    const reference = `mock_${orderId}`;
    this.logger.log(`Created mock payment reference ${reference} for order ${orderId}`);

    return {
      paymentId: reference,
      orderId,
      amount: order.grandTotal,
      provider: 'mock',
      razorpayConfigured: Boolean(cfg.razorpayKeyId && cfg.razorpayKeySecret),
    };
  }

  async verifyPayment(userId: string, orderId: string, reference: string, success: boolean) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new BadRequestException('Order not found');

    const payment = await this.prisma.payment.upsert({
      where: { reference },
      create: {
        userId,
        orderId,
        provider: 'mock',
        reference,
        amount: order.grandTotal,
        status: success ? 'paid' : 'failed',
      },
      update: { status: success ? 'paid' : 'failed' },
    });

    if (success) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'confirmed' } });
    }

    return { verified: success, paymentId: payment.id, status: payment.status };
  }
}
