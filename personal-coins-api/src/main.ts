import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { PORT } from './configurations/env.config';
import { setupDb } from 'database/database';

async function bootstrap() {
  setupDb();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_PORTAL_DOMAIN
  })
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('Coin API')
    .setDescription('Coin APIs to call')
    .setVersion('1.0')
    .addTag('coins')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);
  await app.listen(PORT);
}
bootstrap();
