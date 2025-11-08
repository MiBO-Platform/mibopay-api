import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

type TetherWebhook = {
  type: 'ONCHAIN_CONFIRMED' | 'ONCHAIN_FAILED' | string;
  paymentId: string;
  txHash?: string;
  amount?: string;
  currency?: 'USDT' | string;
  // ...otros campos que el WDK envíe
};

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  private verifySignature(headers: Record<string, string>, rawBody: Buffer): boolean {
    const secret = process.env.TETHER_WEBHOOK_SECRET ?? 'whsec_dev';
    // Header esperado, ajusta si el WDK usa otro nombre
    const sig = headers['x-tether-signature'] || headers['x-signature'] || '';

    // MVP: si estás en dev y secret es 'whsec_dev', permitir vacío
    if (secret === 'whsec_dev' && !sig) return true;

    // HMAC SHA256 del raw body
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  }

  /**
   * Procesa el webhook del WDK: confirma/fracasa el pago, calcula split 90/10 (o según bps),
   * guarda PaymentEvent y opcionalmente registra WebhookLog.
   */
  async handleTether(headers: Record<string, string>, rawBody: Buffer, payload: TetherWebhook) {
    // 1) Verificar firma (opcional en MVP)
    const ok = this.verifySignature(headers, rawBody);
    if (!ok) throw new BadRequestException('Invalid signature');

    // 2) Validar payload mínimo
    const { type, paymentId, txHash } = payload || {};
    if (!paymentId) throw new BadRequestException('Missing paymentId');

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { merchant: true },
    });
    if (!payment) throw new BadRequestException('Payment not found');

    // 3) Resolver acción por tipo
    if (type === 'ONCHAIN_CONFIRMED') {
      // Calcular split usando platformFeeBps del merchant
      const platformBps = payment.merchant.platformFeeBps ?? 1000; // 10% por defecto
      const amount = payment.amount; // Decimal
      // Prisma Decimal -> usa operaciones con string para precisión
      const amountStr = amount.toString();
      const platformShareStr = (BigInt(Math.round(Number(amountStr) * 1e6)) * BigInt(platformBps) / BigInt(10000))
        .toString(); // en "microUSDT" para evitar floating (opcional)
      // Versión simple (MVP) con float seguro por ser demo:
      const platformShare = Number(amountStr) * (platformBps / 10000);
      const merchantShare = Number(amountStr) - platformShare;

      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CONFIRMED',
          txHash: txHash ?? payment.txHash,
          confirmedAt: new Date(),
          merchantShare,
          platformShare,
        },
      });

      // Evento
      await this.prisma.paymentEvent.create({
        data: { paymentId, type: 'ONCHAIN_CONFIRMED', data: payload as any },
      });

      // (Opcional) Log del webhook
      await this.safeLogWebhook('tether', type, payload, 'OK');

      return { ok: true, payment: updated };
    }

    if (type === 'ONCHAIN_FAILED') {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      });

      await this.prisma.paymentEvent.create({
        data: { paymentId, type: 'ONCHAIN_FAILED', data: payload as any },
      });

      await this.safeLogWebhook('tether', type, payload, 'FAILED');

      return { ok: true, payment: updated };
    }

    // Tipos desconocidos → solo registrar evento
    await this.prisma.paymentEvent.create({
      data: { paymentId, type: type ?? 'UNKNOWN', data: payload as any },
    });
    await this.safeLogWebhook('tether', type ?? 'UNKNOWN', payload, 'IGNORED');
    return { ok: true, ignored: true };
  }

  private async safeLogWebhook(provider: string, eventType: string, payload: any, response: string) {
    try {
      await this.prisma.webhookLog.create({
        data: { provider, eventType, payload, response },
      });
    } catch {
      // Silenciar errores de logging en MVP
    }
  }
}
