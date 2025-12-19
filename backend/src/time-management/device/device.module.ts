import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSyncService } from './services/device-sync.service';
import { DeviceSyncController } from './controllers/device-sync.controller';
import { Punch, PunchSchema } from '../attendance/schemas/punch.schema';
import { AttendanceRecord, AttendanceRecordSchema } from '../attendance/schemas/attendance-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Punch.name, schema: PunchSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
    ]),
  ],
  controllers: [DeviceSyncController],
  providers: [DeviceSyncService],
  exports: [DeviceSyncService],
})
export class DeviceModule {}

