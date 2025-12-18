import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();

  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hr_system';
  const port = process.env.PORT || 5001;

  console.log('🔌 Connecting to MongoDB...');
  console.log(`📍 URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

  const app = await NestFactory.create(AppModule);

  // ---- CORS SETUP ----
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      /^http:\/\/172\.\d+\.\d+\.\d+:3000/, // Allow network IP on port 3000
      /^http:\/\/172\.\d+\.\d+\.\d+:3001/, // Allow network IP on port 3001
      /^http:\/\/172\.\d+\.\d+\.\d+:3002/, // Allow network IP on port 3002
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'x-user-role',
    ],
    credentials: true,
  });

  // ---- SWAGGER SETUP (Optional - can be disabled) ----
  if (process.env.ENABLE_SWAGGER !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('HR System API')
      .setDescription('API documentation for HR System')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // ---- START APPLICATION ----
  await app.listen(port);

  console.log(`\n🚀 Backend server running on http://localhost:${port}`);
  console.log(`✅ MongoDB connection will be confirmed above when ready`);
  if (process.env.ENABLE_SWAGGER !== 'false') {
    console.log(`📚 Swagger docs: http://localhost:${port}/api`);
  }
  console.log('');
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});
