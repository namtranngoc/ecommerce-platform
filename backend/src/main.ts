import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Mở CORS để Frontend gọi được API
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();