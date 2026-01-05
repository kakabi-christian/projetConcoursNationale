import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Activer CORS pour React (port 3001)
 app.enableCors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3002',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

  // ✅ Configuration Swagger (AVANT listen)
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Documentation de mon API NestJS avec Swagger')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ✅ UN SEUL listen
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📘 Swagger: http://localhost:${port}/api/docs`);
  console.log(`📂 Static files: http://localhost:${port}/uploads/`);
}

bootstrap();
