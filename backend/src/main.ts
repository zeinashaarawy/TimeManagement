import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

async function bootstrap() {
  console.log("BACKEND DB URI =>", process.env.MONGO_URI);
  console.log("Database name: hr_system");

  const app = await NestFactory.create(AppModule);

  // ---- CORS SETUP ----
  app.enableCors({
    origin: true, // Allow all origins (or specify: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.100.4:3001'])
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---- SWAGGER SETUP ----
  const config = new DocumentBuilder()
    .setTitle('Employee Profile API')
    .setDescription('API documentation for Employee Profile, Change Requests, Disputes, and Manager Views')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
   // ---- START APPLICATION ----
  await app.listen(process.env.PORT || 3000);

  console.log("USING DB URI:", process.env.MONGO_URI);
  console.log(`Swagger running at http://localhost:${process.env.PORT || 3000}/api ✅`);
  console.log("MongoDB collection for policies: timepolicies");
}

bootstrap();