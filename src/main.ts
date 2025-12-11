import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Servir le dossier uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
      else if (path.endsWith('.wav')) res.setHeader('Content-Type', 'audio/wav');
      else if (path.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
      else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    }
  }));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
