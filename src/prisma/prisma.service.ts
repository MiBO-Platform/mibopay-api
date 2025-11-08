import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Activa logging si necesitas depurar queries:
    // super({ log: [{ level: 'query', emit: 'event' }, 'info', 'warn', 'error'] });
    super();
    // Si dejaste el log de queries arriba, puedes escuchar así:
    // this.$on('query', (e) => console.log('🟣 PRISMA', e.query, e.params, `${e.duration}ms`));
  }

  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Cierra Prisma cuando NestJS apaga la app (Ctrl+C, SIGTERM, etc.)
   */
  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });
  }

  /**
   * Helper para convertir Decimals a string en respuestas JSON
   * (úsalo en controllers si devuelves entidades con montos)
   */
  toPlain<T = any>(data: T): T {
    return JSON.parse(
      JSON.stringify(data, (_k, v) =>
        v?.constructor?.name === 'Decimal' ? v.toString() : v,
      ),
    );
  }
}
