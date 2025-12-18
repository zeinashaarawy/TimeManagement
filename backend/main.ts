import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TimeManagementModule } from './src/time-management/time-management.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(TimeManagementModule);

  // Allow frontend (dev on 3000/3001) to call the API
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Enable global validation pipe for DTO validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for extra properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Swagger setup for API documentation
  const config = new DocumentBuilder()
    .setTitle('Time Management API')
    .setDescription('API documentation for Time Management subsystem - Phase 1: Shift Setup & Scheduling')
    .setVersion('1.0')
    .addTag('shifts', 'Shift template management')
    .addTag('assignments', 'Schedule assignment operations')
    .addTag('notifications', 'Shift expiry notifications')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
