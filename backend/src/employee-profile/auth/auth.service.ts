import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../models/employee-system-role.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeeStatus, SystemRole } from '../enums/employee-profile.enums';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(EmployeeSystemRole.name)
    private readonly employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: { employeeNumber: string; password: string }) {
    // ✅ Step 1: find employee by employeeNumber
    const employee = await this.employeeModel.findOne({ employeeNumber: dto.employeeNumber });
    if (!employee) {
      throw new NotFoundException('Employee not found ❌');
    }

    // ✅ Step 2: compare password with hashed password
    const isMatch = await bcrypt.compare(dto.password, employee.password as string);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials ❌ (Wrong password)');
    }

    // ✅ Step 3: Get user's role from employee_system_roles collection
    const systemRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employee._id,
      isActive: true,
    });

    // Get the first active role, or default to 'department employee' if none found
    const userRole = systemRole?.roles?.[0] || SystemRole.DEPARTMENT_EMPLOYEE;

    // ✅ Step 4: build JWT payload based on your project
    const payload = {
      id: employee._id.toString(),
      role: userRole,
      username: employee.firstName + " " + employee.lastName,
    };

    // ✅ Step 5: generate token
    const token = await this.jwtService.signAsync(payload);

    // ✅ Step 6: return it in the same logic structure
    return {
      access_token: token,
      payload,
    };
  }
  
async register(dto: RegisterDto) {
  // ✅ Step 1: Check if employee number already exists
  const exists = await this.employeeModel.findOne({ employeeNumber: dto.employeeNumber });
  if (exists) {
    throw new BadRequestException("Employee number already exists ❌");
  }

  // ✅ Step 2: Check if national ID already exists
  const nationalIdExists = await this.employeeModel.findOne({ nationalId: dto.nationalId });
  if (nationalIdExists) {
    throw new BadRequestException("National ID already exists ❌");
  }

  // ✅ Step 3: Hash password
  const hashedPassword = await bcrypt.hash(dto.password, 10);

  // ✅ Step 4: Create employee in employee_profiles collection
  const newEmployee = new this.employeeModel({
    employeeNumber: dto.employeeNumber,
    password: hashedPassword,
    status: EmployeeStatus.ACTIVE,
    nationalId: dto.nationalId,
    firstName: dto.firstName,
    lastName: dto.lastName,
    dateOfHire: new Date(dto.dateOfHire),
    address: {
      city: dto.address.city,
      streetAddress: dto.address.street, // Note: schema uses streetAddress, not street
    },
  });

  const savedEmployee = await newEmployee.save();

  // ✅ Step 5: Create role entry in employee_system_roles collection
  const systemRole = new this.employeeSystemRoleModel({
    employeeProfileId: savedEmployee._id,
    roles: [dto.role], // Store role in the roles array
    permissions: [], // Can be populated later if needed
    isActive: true,
  });

  await systemRole.save();

  // ✅ Step 6: Return employee data (without password)
  const { password, ...employeeData } = savedEmployee.toObject();
  return employeeData;
}
}
