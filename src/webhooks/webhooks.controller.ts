import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

// Si usas verificación de firma HMAC, necesitamos acceso al raw body del request.
interface RawBodyRequest<T = any> extends Request {
  rawBody: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Post('tether')
  @ApiBody({
    schema: {
      example: {
        type: 'ONCHAIN_CONFIRMED',
        paymentId: 'pay_123',
        txHash: '0xDEADBEEF...',
        amount: '50.0',
        currency: 'USDT',
      },
    },
  })
  @ApiOkResponse({ description: 'Webhook processed' })
  async tether(
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest,
    @Body() body: any,
  ) {
    return this.service.handleTether(headers, req.rawBody ?? Buffer.from(''), body);
  }
}
