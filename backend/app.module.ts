import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeManagementModule } from './src/time-management/time-management.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), 
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    TimeManagementModule,
  ],
})
export class AppModule {}
