import { NestFactory } from '@nestjs/core';
import { TimeManagementModule } from './src/time-management/time-management.module';

async function bootstrap() {
  const app = await NestFactory.create(TimeManagementModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
