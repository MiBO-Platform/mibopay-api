// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Raw body SOLO para webhooks (recomendado)
  app.use('/webhooks/tether', bodyParser.raw({ type: '*/*' }));

  // Swagger (si ya lo tienes)
  const config = new DocumentBuilder()
    .setTitle('MiboPay API')
    .setDescription('MVP – Avalanche + Tether WDK (hackathon)')
    .setVersion('0.1.0')
    .addTag('merchant')
    .addTag('payment-links')
    .addTag('payments')
    .addTag('webhooks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
