// src/payments/payments.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

class CheckoutDto {
  linkCode: string;
  amount?: string;
  payerAddress?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('checkout')
  @ApiBody({ type: CheckoutDto, examples: {
    fixed: { value: { linkCode: 'XYZ123', payerAddress: '0xabc...' } },
    open:  { value: { linkCode: 'OPEN01', amount: '12.5', payerAddress: '0xabc...' } },
  }})
  checkout(@Body() body: CheckoutDto) {
    return this.service.checkout(body);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Payment detail' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get()
  @ApiOkResponse({ description: 'Recent payments' })
  list(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 20;
    return this.service.listRecent(Number.isFinite(n) ? n : 20);
  }
}
