import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeProfile, EmployeeProfileSchema } from '../models/employee-profile.schema';
import { AuthService } from './auth.service';
import { EmployeeProfileController } from './auth.controller';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../models/employee-system-role.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    // Register Employee schema for Auth login
    MongooseModule.forFeature([{ name: 'EmployeeProfile', schema: EmployeeProfileSchema },
        { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema }
    ]),

    // Register JWT
    JwtModule.register({
  secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_CHANGE_THIS',
  signOptions: { expiresIn: '2h' },
})
  ],
  controllers: [EmployeeProfileController], // ✅ must be the real controller class
  providers: [AuthService,  RolesGuard],
  exports: [AuthService]

})
export class AuthModule {}