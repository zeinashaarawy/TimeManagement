import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionValidationService } from './services/permission-validation.service';
import { PermissionValidationController } from './controllers/permission-validation.controller';
import { EmployeeProfile, EmployeeProfileSchema } from '../../employee-profile/models/employee-profile.schema';
import { TimePolicy, TimePolicySchema } from '../policy/schemas/time-policy.schema';
import { TimeException, TimeExceptionSchema } from '../attendance/schemas/time-exception.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: TimePolicy.name, schema: TimePolicySchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
    ]),
  ],
  controllers: [PermissionValidationController],
  providers: [PermissionValidationService],
  exports: [PermissionValidationService],
})
export class PermissionModule {}

