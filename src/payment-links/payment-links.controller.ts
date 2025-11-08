import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';

@Controller('payment-links')
export class PaymentLinksController {
  constructor(private paymentLinksService: PaymentLinksService) {}

  /**
   * Crea un nuevo link de pago
   * POST /payment-links
   */
  @Post()
  async create(@Body() body: { title?: string; description?: string; amount?: string }) {
    return this.paymentLinksService.createLink(body);
  }

  /**
   * Lista todos los links del merchant semilla
   * GET /payment-links
   */
  @Get()
  async list() {
    return this.paymentLinksService.listLinks();
  }

  /**
   * Información pública de un link
   * GET /payment-links/public/:code
   */
  @Get('public/:code')
  async getPublic(@Param('code') code: string) {
    return this.paymentLinksService.getPublicInfo(code);
  }
}
