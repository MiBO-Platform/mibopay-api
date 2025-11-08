// src/payment-links/payment-links.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { PaymentLinksService } from './payment-links.service';

class CreatePaymentLinkDto {
  title?: string;
  description?: string;
  amount?: string; // string para no pelear con decimales
}

@ApiTags('payment-links')
@Controller('payment-links')
export class PaymentLinksController {
  constructor(private paymentLinksService: PaymentLinksService) {}

  @Post()
  @ApiBody({ type: CreatePaymentLinkDto, examples: {
    sample: {
      summary: 'Monto fijo',
      value: { title: 'Logo Design', description: 'Payment for design', amount: '50' }
    }
  }})
  create(@Body() body: CreatePaymentLinkDto) {
    return this.paymentLinksService.createLink(body);
  }

  @Get()
  @ApiOkResponse({ description: 'List of payment links' })
  list() {
    return this.paymentLinksService.listLinks();
  }

  @Get('public/:code')
  @ApiOkResponse({ description: 'Public info for checkout page' })
  getPublic(@Param('code') code: string) {
    return this.paymentLinksService.getPublicInfo(code);
  }
}
