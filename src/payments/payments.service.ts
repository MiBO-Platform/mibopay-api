import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CheckoutDto = {
  linkCode: string;
  amount?: string;       // requerido si el link es "open amount"
  payerAddress?: string; // opcional (0x...)
};

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Inicia el checkout: valida el link, determina el monto y crea el Payment
   * Retorna un intent "mock" para que el front continúe el flujo.
   */
  async checkout(dto: CheckoutDto) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { code: dto.linkCode },
      include: { merchant: true },
    });
    if (!link || link.status !== 'ACTIVE') {
      throw new NotFoundException('Invalid or inactive payment link.');
    }

    // Si el link NO tiene amount, debe venir en el body
    const amountStr = link.amount?.toString() ?? dto.amount;
    if (!amountStr) throw new BadRequestException('Amount required for open amount link.');

    const amountNum = Number(amountStr);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      throw new BadRequestException('Invalid amount.');
    }

    // Crea el pago en estado PENDING
    const payment = await this.prisma.payment.create({
      data: {
        merchantId: link.merchantId,
        paymentLinkId: link.id,
        amount: amountNum,             // Prisma Decimal soporta number/string
        currency: 'USDT',
        status: 'PENDING',
        payerAddress: dto.payerAddress ?? null,
        chain: 'AVAX_FUJI',
      },
    });

    // Split planeado (MVP 90/10)
    const splitsPlanned = [
      { label: 'Merchant', mode: 'PERCENT', percentBps: 9000 },
      { label: 'Platform', mode: 'PERCENT', percentBps: 1000 },
    ];

    // Intent "mock" (luego reemplazas por Tether WDK)
    const tetherIntent = {
      intentId: `intent_${payment.id}`,
      amount: amountStr,
      currency: 'USDT',
    };

    // Evento de tracing
    await this.prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: 'CHECKOUT_CREATED',
        data: { linkCode: dto.linkCode, amount: amountStr, splitsPlanned },
      },
    });

    return {
      paymentId: payment.id,
      amountFinal: amountStr,
      currency: 'USDT',
      tetherIntent,
      splitsPlanned,
    };
  }

  /**
   * Detalle de un pago
   */
  async detail(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { paymentLink: { select: { code: true, title: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found.');

    return payment;
  }

  /**
   * Lista los pagos más recientes del merchant semilla (para dashboard)
   */
  async listRecent(limit = 20) {
    const merchant = await this.prisma.merchant.findFirst();
    if (!merchant) throw new NotFoundException('Merchant not found. Run seed first.');

    return this.prisma.payment.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
