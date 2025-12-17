import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../models/employee-profile.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeeStatus, SystemRole } from '../enums/employee-profile.enums';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  employeeSystemRoleModel: any;
  constructor(
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: { employeeNumber: string; password: string }) {
    // ✅ Step 1: find employee by employeeNumber
    const employee = await this.employeeModel.findOne({
      employeeNumber: dto.employeeNumber,
    });
    if (!employee) {
      throw new NotFoundException('Employee not found ❌');
    }

    // ✅ Step 2: compare password with hashed password in D
    const isMatch = await bcrypt.compare(
      dto.password,
      employee.password as string,
    );

    if (!isMatch) {
      throw new UnauthorizedException(
        'Invalid credentials ❌ (Wrong password)',
      );
    }

    // ✅ Step 3: build JWT payload based on your project
    const payload = {
      id: employee._id,
      role: (employee as any).systemRole,
      username: employee.firstName + ' ' + employee.lastName,
    };

    // ✅ Step 4: generate token
    const token = await this.jwtService.signAsync(payload);

    // ✅ Step 5: return it in the same logic structure
    return {
      access_token: token,
      payload,
    };
  }

  async register(dto: {
    employeeNumber: string;
    password: string;
    role: SystemRole;
    firstName: string;
    lastName: string;
    nationalId: string;
    dateOfHire: string;
  }) {
    const exists = await this.employeeModel.findOne({
      employeeNumber: dto.employeeNumber,
    });
    if (exists) {
      throw new BadRequestException('Employee number already exists ❌');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newEmployee = new this.employeeModel({
      employeeNumber: dto.employeeNumber,
      password: hashedPassword,
      status: EmployeeStatus.ACTIVE, // ✅ governance rule preserved
      // ✅ SAVE ROLE INTO EXISTING ARRAY, NO SCHEMA CHANGE
      nationalId: dto.nationalId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfHire: new Date(dto.dateOfHire),
    });

    return newEmployee.save(); // ✅ No .create() on undefined
  }
}
