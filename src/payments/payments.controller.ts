import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  /**
   * Inicia checkout
   * body: { linkCode, amount?, payerAddress? }
   */
  @Post('checkout')
  checkout(@Body() body: { linkCode: string; amount?: string; payerAddress?: string }) {
    return this.service.checkout(body);
  }

  /**
   * Detalle de pago por id
   */
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  /**
   * Listado simple (para dashboard)
   * /payments?limit=20
   */
  @Get()
  list(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 20;
    return this.service.listRecent(Number.isFinite(n) ? n : 20);
  }
}
