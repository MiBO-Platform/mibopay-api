import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS si estás usando subdominios tipo pay/merchant:
  // app.enableCors({ origin: ['https://pay.mibo.one', 'https://merchant.mibo.one'] });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(3000);
}
bootstrap();
