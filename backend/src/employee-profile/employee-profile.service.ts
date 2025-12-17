import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from './models/employee-profile.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SelfUpdateDto } from './dto/self-update.dto';
import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { ProfileChangeStatus } from './enums/employee-profile.enums';
import { randomUUID } from 'crypto';
import { EmployeeStatus } from './enums/employee-profile.enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeProfileService {
  constructor(
  @InjectModel(EmployeeProfile.name)
  private readonly employeeModel: Model<EmployeeProfileDocument>,

  @InjectModel(EmployeeProfileChangeRequest.name)
  private readonly changeRequestModel: Model<EmployeeProfileChangeRequest>,
) {}

private readonly ALLOWED_CHANGE_REQUEST_FIELDS = [
  'nationalId',
  'personalEmail',
  'workEmail',
  'firstName',
  'lastName',
];
  // -------- CREATE (HR / Admin) --------
  async create(createDto: CreateEmployeeDto) {
    // Mongoose will cast strings to Date/ObjectId as needed
    const created = new this.employeeModel({
      ...createDto,
      dateOfHire: new Date(createDto.dateOfHire),
      contractStartDate: createDto.contractStartDate
        ? new Date(createDto.contractStartDate)
        : undefined,
      contractEndDate: createDto.contractEndDate
        ? new Date(createDto.contractEndDate)
        : undefined,
    });
    return created.save();
  }

  // -------- READ ALL --------
  async findAll(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  return this.employeeModel
    .find()
    .skip(skip)
    .limit(limit)
    .populate('primaryDepartmentId')
    .populate('primaryPositionId')
    .populate('supervisorPositionId')
    .lean();
}

  // -------- READ ONE --------
  async findOne(id: string) {
    const employee = await this.employeeModel
      .findById( id )
      .populate('primaryDepartmentId')
      .populate('primaryPositionId')
      .populate('supervisorPositionId')
      .lean();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }
  // -------- SET / CHANGE PASSWORD (HR/Admin) --------
async setPassword(id: string, password: string) {
  // Step 1: find employee
  const employee = await this.employeeModel.findById(id);
  if (!employee) {
    throw new NotFoundException("Employee not found 🧑‍🏫");
  }

  // Step 2: hash the password (hide it like magic 🔮)
  const hashed = await bcrypt.hash(password, 10);

  // Step 3: save hashed password
  await this.employeeModel.findByIdAndUpdate(
    id,
    { password: hashed },
    { new: true }
  );

  // Step 4: say done ✅
  return { message: "Password updated successfully 🔐", id };
}

  // -------- UPDATE (HR / Admin) --------
  // -------- UPDATE (HR / Admin) --------
  async update(id: string, updateDto: UpdateEmployeeDto) {
    // convert dates if provided
    const payload: any = { ...updateDto };

    if (updateDto.dateOfHire) {
      payload.dateOfHire = new Date(updateDto.dateOfHire);
    }
    if (updateDto.contractStartDate) {
      payload.contractStartDate = new Date(updateDto.contractStartDate);
    }
    if (updateDto.contractEndDate) {
      payload.contractEndDate = new Date(updateDto.contractEndDate);
    }

    const updated = await this.employeeModel
      .findByIdAndUpdate(id, payload, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return updated;
  }
  // -------- DELETE / DEACTIVATE (optional) --------
 
// -------- DEACTIVATE (NOT DELETE) --------


async deactivate(id: string) {
  // Step 1: find employee
  const employee = await this.employeeModel.findById(id);
  if (!employee) {
    throw new NotFoundException("Employee not found 🧑‍🏫");
  }

  // Step 2: remember old status ✅ (schema still untouched)
  const oldStatus = employee.status;

  // Step 3: update employee to inactive using ENUM ✅
  const updated = await this.employeeModel.findByIdAndUpdate(
    id,
    { status: EmployeeStatus.INACTIVE },
    { new: true }
  ).lean();

  // Step 4: return response ✅
  return {
    message: "Employee is now deactivated 😴",
    id,
    oldStatus,
    newStatus: EmployeeStatus.INACTIVE,
    updatedEmployee: updated
  };
}

// ================================
// EMPLOYEE SELF-SERVICE UPDATE
// ================================
  async selfUpdate(employeeId: string, dto: SelfUpdateDto) {
  const allowed = ['phone', 'personalEmail', 'workEmail', 'biography', 'address'];

  // Remove any forbidden fields
  const payload: any = {};
  for (const key of allowed) {
    if (dto[key] !== undefined) {
      payload[key] = dto[key];
    }
  }

  const updated = await this.employeeModel.findByIdAndUpdate(
    employeeId,
    payload,
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundException('Employee not found');
  }

  return updated;
}
// ================================
// CREATE CHANGE REQUEST (Employee)
// ================================
// ================================
// CREATE CHANGE REQUEST (Employee)
// ================================
async createChangeRequest(employeeId: string, dto: CreateChangeRequestDto) {
  if (!dto) {
    throw new UnauthorizedException("Request body is empty ❌");
  }

  const employee = await this.employeeModel.findById(employeeId);
  if (!employee) {
    throw new NotFoundException("Employee not found ❌");
  }

  // ✅ FIX: use dto.employeeProfileId (because DTO actually contains it)
  const profileId = dto.employeeProfileId;
  if (!profileId) {
    throw new ForbiddenException("employeeProfileId is required in body ❌");
  }

  // ✅ Validate field from DTO union
  const ALLOWED_FIELDS: CreateChangeRequestDto["field"][] = [
    'firstName',
    'lastName',
    'lastName',
    'nationalId',
    'primaryPositionId',
    'primaryDepartmentId',
    'contractType',
    'workType',
  ];

  if (!ALLOWED_FIELDS.includes(dto.field)) {
    throw new ForbiddenException(
      `Invalid field '${dto.field}' ❌`,
    );
  }

  // ✅ Generate requestId & description correctly
  const requestId = randomUUID();
  const requestDescription = JSON.stringify({
    field: dto.field,
    newValue: dto.newValue,
    reason: dto.reason ?? "",
  });

  const created = new this.changeRequestModel({
    requestId,
    employeeProfileId: profileId, // ✅ filled correctly now
    field: dto.field,
    newValue: dto.newValue,
    reason: dto.reason ?? "",
    requestDescription, // ✅ no double stringify
    status: ProfileChangeStatus.PENDING,
    submittedAt: new Date(),
  });

  return created.save(); // ✅ no schema failure anymore
}


// ================================
// GET ALL REQUESTS FOR EMPLOYEE
// ================================
async getEmployeeChangeRequests(employeeProfileId: string) {
  return this.changeRequestModel
    .find({ employeeProfileId})
    .sort({ submittedAt: -1 })
    .lean();
}
// ================================
// HR APPROVES REQUEST
// ================================

// HR APPROVES REQUEST
// ================================

async approveChangeRequest(changeRequestMongoId: string) {
  const request = await this.changeRequestModel.findById(changeRequestMongoId);
  if (!request) {
    throw new NotFoundException("Change request not found ❌");
  }

  // ----------------- NEW PART -----------------
  // We support 2 cases:
  // 1) New format: requestDescription = JSON string {"field","newValue","reason"}
  // 2) Old format: requestDescription = "Please update ..." and field/newValue stored directly
  const raw = (request as any).requestDescription;
  let data: { field: string; newValue: string; reason?: string };

  if (typeof raw === 'string') {
    if (raw.trim().startsWith('{')) {
      // new format → parse JSON
      try {
        data = JSON.parse(raw);
      } catch {
        throw new BadRequestException(
          'Corrupted requestDescription JSON ❌ – please recreate this change request',
        );
      }
    } else {
      // old format → plain text reason, take field/newValue from document
      data = {
        field: (request as any).field,
        newValue: (request as any).newValue,
        reason: raw,
      };
    }
  } else {
    // if it's already stored as object for some reason
    data = raw as any;
  }

  if (!data.field || !data.newValue) {
    throw new BadRequestException(
      'Change request is missing field/newValue ❌ – please create a new one',
    );
  }
  // ----------------- END NEW PART -----------------

  const employeeProfileId = (request as any).employeeProfileId;
  const employee = await this.employeeModel.findById(employeeProfileId);
  if (!employee) {
    throw new NotFoundException('Employee not found ❌');
  }

  // special case for nationalId (unique)
  if (data.field === 'nationalId') {
    // if it’s the same value, just approve and exit
    if (employee.nationalId === data.newValue) {
      await this.changeRequestModel.findByIdAndUpdate(changeRequestMongoId, {
        status: ProfileChangeStatus.APPROVED,
      });
      return {
        message:
          'No update needed – nationalId already has this value, request marked APPROVED ✅',
      };
    }

    const duplicate = await this.employeeModel.findOne({
      nationalId: data.newValue,
    });
    if (duplicate) {
      throw new BadRequestException(
        'Cannot approve – another employee already has this nationalId ❌',
      );
    }
  }

  // apply change
  await this.employeeModel.findByIdAndUpdate(employeeProfileId, {
    [data.field]: data.newValue,
  });

  await this.changeRequestModel.findByIdAndUpdate(changeRequestMongoId, {
    status: ProfileChangeStatus.APPROVED,
  });

  return { message: 'Change request approved and employee updated ✅' };
}




async rejectChangeRequest(id: string, reason: string) {
  const request = await this.changeRequestModel.findById(id);
  if (!request) throw new NotFoundException('Request not found');

  request.status = ProfileChangeStatus.REJECTED;
  request.processedAt = new Date();
  request.reason = reason;

  return request.save();
}

// Manager sees list of employees reporting to them (only summary)
// Manager sees list of employees reporting to them (only summary)
async getTeamSummaryForManager(managerId: string) {
  return this.employeeModel
    .find({ supervisorPositionId: managerId }) // ✅ FIXED FIELD
    .select('firstName lastName primaryDepartmentId primaryPositionId employeeStatus')
    .populate('primaryDepartmentId')
    .populate('primaryPositionId')
    .lean();
}

// Manager sees one employee but must belong to their team
async getTeamEmployeeSummary(managerId: string, employeeId: string) {
  const employee = await this.employeeModel
    .findOne({ _id: employeeId, supervisorPositionId: managerId }) // ✅ FIXED FIELD
    .select('firstName lastName primaryDepartmentId primaryPositionId employeeStatus')
    .populate('primaryDepartmentId', 'name')
    .populate('primaryPositionId', 'title')

    .lean();

  if (!employee) {
    throw new NotFoundException('Employee not found in your team');
  }

  return employee;
}


async getAllChangeRequests() {
  return this.changeRequestModel
    .find()
    .sort({ submittedAt: -1 })
    .lean();
}

// Find request by UUID only using existing requestId field
async findChangeRequestByUUID(requestId: string) {
  const request = await this.changeRequestModel.findOne({ requestId }).lean();
  if (!request) {
    throw new NotFoundException('Request not found');
  }
  return request;
}

// ❗ Dispute logic (missing earlier)
  async submitDispute(dto: { employeeProfileId: string; originalRequestId: string; dispute: string }) {
  const requestId = randomUUID(); // REQUIRED

  const created = new this.changeRequestModel({
    requestId, // required
    employeeProfileId: dto.employeeProfileId, // required

    // store the dispute target inside requestDescription
    requestDescription:`disputeFor:${dto.originalRequestId}`,

    reason: dto.dispute, // required
    status: ProfileChangeStatus.PENDING, // using existing enum
    submittedAt: new Date(),
  });

  return created.save();
}

  
   
  async withdrawChangeRequest(id: string) {
  const request = await this.changeRequestModel.findById(id);
  if (!request) throw new NotFoundException('Request not found');

  // Can only withdraw if pending
  if (request.status !== ProfileChangeStatus.PENDING) {
    throw new Error('Only pending requests can be withdrawn');
  }

  request.status = ProfileChangeStatus.REJECTED;
  request.reason = "Withdrawn by employee";
  request.processedAt = new Date();

  await request.save();

  return {
    message: 'Change request withdrawn successfully',
    requestId: request.requestId,
    status: request.status,
  };
}



async resolveDispute(id: string, resolution: string) {
  const dispute = await this.changeRequestModel.findById(id);
  if (!dispute) throw new NotFoundException("Dispute not found");

  // HR resolves dispute (must use enum)
  dispute.status = ProfileChangeStatus.REJECTED;  // The dispute is now closed
  dispute.reason = resolution;
  dispute.processedAt = new Date();

  return dispute.save();
}
async approveDispute(id: string, resolution: string) {
  const dispute = await this.changeRequestModel.findById(id);
  if (!dispute) throw new NotFoundException("Dispute not found");

  // HR approves the dispute (employee wins)
  dispute.status = ProfileChangeStatus.APPROVED;
  dispute.reason = resolution;
  dispute.processedAt = new Date();

  return dispute.save();
}
async getMyProfile(userId: string) {
  const me = await this.employeeModel.findById(userId).lean();
  if (!me) throw new NotFoundException("Profile not found");
  return me;
}


}
