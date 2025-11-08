import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async getDefaultMerchant() {
    const merchant = await this.prisma.merchant.findFirst({
      include: { primaryWallet: true },
    });
    return merchant ?? { message: 'No merchant found' };
  }

  async getWallets() {
    const merchant = await this.prisma.merchant.findFirst({
      include: { wallets: true },
    });
    return merchant?.wallets ?? [];
  }
}
