import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

let cachedApp: any;

async function createNestServer() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    app.use(json({ limit: '20mb' }));
    app.use(urlencoded({ extended: true, limit: '20mb' }));
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

// Export handler cho Vercel Serverless
export default async function handler(req: any, res: any) {
  const server = await createNestServer();
  return server(req, res);
}

// Chạy bình thường khi ở máy Local
if (process.env.VERCEL !== '1') {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.use(json({ limit: '20mb' }));
    app.use(urlencoded({ extended: true, limit: '20mb' }));
    await app.listen(3000);
  }
  bootstrapLocal();
}