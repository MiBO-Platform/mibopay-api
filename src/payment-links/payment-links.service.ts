import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentLinksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo Payment Link para el merchant semilla (Acme Studio)
   */
  async createLink(dto: { title?: string; description?: string; amount?: string }) {
    // Tomamos el merchant semilla (solo hay uno)
    const merchant = await this.prisma.merchant.findFirst();
    if (!merchant) throw new NotFoundException('Merchant not found. Run seed first.');

    // Generamos código aleatorio del link (tipo "XYZ123")
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const link = await this.prisma.paymentLink.create({
      data: {
        merchantId: merchant.id,
        code,
        title: dto.title ?? 'New Payment',
        description: dto.description ?? null,
        amount: dto.amount ? parseFloat(dto.amount) : null,
        status: 'ACTIVE',
      },
    });

    return {
      message: 'Payment link created',
      link,
      payUrl: `/pay/${code}`,
    };
  }

  /**
   * Devuelve todos los links del merchant semilla
   */
  async listLinks() {
    const merchant = await this.prisma.merchant.findFirst();
    if (!merchant) throw new NotFoundException('Merchant not found.');

    return this.prisma.paymentLink.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Información pública de un link para mostrar en /pay/:code
   */
  async getPublicInfo(code: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { code },
      include: { merchant: { select: { name: true } } },
    });

    if (!link || link.status !== 'ACTIVE') {
      throw new NotFoundException('Invalid or inactive payment link.');
    }

    return {
      code: link.code,
      title: link.title,
      description: link.description,
      amount: link.amount,
      currency: link.currency,
      merchant: { name: link.merchant.name },
    };
  }
}
