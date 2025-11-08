import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantModule } from './merchant/merchant.module';
import { PaymentLinksModule } from './payment-links/payment-links.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [MerchantModule, PaymentLinksModule, PaymentsModule, PrismaModule, WebhooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
