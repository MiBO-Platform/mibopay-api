import { Controller, Get } from '@nestjs/common';
import { MerchantService } from './merchant.service';

@Controller('merchant')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get()
  async getMerchant() {
    return this.merchantService.getDefaultMerchant();
  }

  @Get('wallets')
  async getWallets() {
    return this.merchantService.getWallets();
  }
}
