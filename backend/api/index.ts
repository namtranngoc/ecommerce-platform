import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    const { NestFactory } = await import('@nestjs/core');
    const { AppModule } = await import('../dist/app.module.js');
    const express = await import('express');

    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    const expressLib = express.default || express;
    app.use(expressLib.json({ limit: '20mb' }));
    app.use(expressLib.urlencoded({ extended: true, limit: '20mb' }));

    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await bootstrapServer();
  return server(req, res);
}