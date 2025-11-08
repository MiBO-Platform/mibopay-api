// src/merchant/merchant.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';

@ApiTags('merchant')
@Controller('merchant')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get()
  @ApiOkResponse({ description: 'Default seeded merchant' })
  getMerchant() {
    return this.merchantService.getDefaultMerchant();
  }

  @Get('wallets')
  @ApiOkResponse({ description: 'Wallets for default merchant' })
  getWallets() {
    return this.merchantService.getWallets();
  }
}
