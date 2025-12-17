import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { UpdateAppraisalStatusDto } from './dto/update-appraisal-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

import {
  AppraisalTemplate,
  AppraisalTemplateDocument,
} from './models/appraisal-template.schema';

import {
  AppraisalCycle,
  AppraisalCycleDocument,
} from './models/appraisal-cycle.schema';

import {
  AppraisalRecord,
  AppraisalRecordDocument,
} from './models/appraisal-record.schema';

import {
  AppraisalDispute,
  AppraisalDisputeDocument,
} from './models/appraisal-dispute.schema';

import {
  AppraisalCycleStatus,
  AppraisalTemplateType,
  AppraisalRecordStatus,
  AppraisalDisputeStatus,
} from './enums/performance.enums';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(AppraisalTemplate.name)
    private readonly templateModel: Model<AppraisalTemplateDocument>,

    @InjectModel(AppraisalCycle.name)
    private readonly cycleModel: Model<AppraisalCycleDocument>,

    @InjectModel(AppraisalRecord.name)
    private readonly recordModel: Model<AppraisalRecordDocument>,

    @InjectModel(AppraisalDispute.name)
    private readonly disputeModel: Model<AppraisalDisputeDocument>,
  ) {}

  // ======================================================
  // TEMPLATES
  // ======================================================

  async createTemplate(body: any) {
    const created = new this.templateModel(body);
    return created.save();
  }

  async getAllTemplates() {
    return this.templateModel.find().lean();
  }

  async getTemplateById(id: string) {
    const template = await this.templateModel.findById(id).lean();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(id: string, body: any) {
    const updated = await this.templateModel
      .findByIdAndUpdate(id, body, { new: true })
      .lean();

    if (!updated) throw new NotFoundException('Template not found');

    return updated;
  }

  async deleteTemplate(id: string) {
    const deleted = await this.templateModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('Template not found');
    return { message: 'Template deleted', id };
  }

  // ======================================================
  // CYCLES
  // ======================================================

  async createCycle(body: any) {
    const created = new this.cycleModel({
      ...body,
      status: AppraisalCycleStatus.PLANNED,
    });

    return created.save();
  }

  async getAllCycles() {
    return this.cycleModel.find().lean();
  }

  async getCycleById(id: string) {
    const cycle = await this.cycleModel.findById(id).lean();
    if (!cycle) throw new NotFoundException('Cycle not found');
    return cycle;
  }

  async updateCycle(id: string, body: any) {
    const updated = await this.cycleModel
      .findByIdAndUpdate(id, body, { new: true })
      .lean();

    if (!updated) throw new NotFoundException('Cycle not found');
    return updated;
  }

  async activateCycle(id: string) {
    return this.updateCycle(id, {
      status: AppraisalCycleStatus.ACTIVE,
      publishedAt: new Date(),
    });
  }

  async closeCycle(id: string) {
    return this.updateCycle(id, {
      status: AppraisalCycleStatus.CLOSED,
      closedAt: new Date(),
    });
  }

  async archiveCycle(id: string) {
    return this.updateCycle(id, {
      status: AppraisalCycleStatus.ARCHIVED,
      archivedAt: new Date(),
    });
  }

  // ======================================================
  // APPRAISAL RECORDS
  // ======================================================

  // Manager creates appraisal record
  async createAppraisal(dto: CreateAppraisalRecordDto, managerId: string) {
    const record = new this.recordModel({
      ...dto,
      managerProfileId: new Types.ObjectId(managerId),
      status: AppraisalRecordStatus.DRAFT,
    });

    return record.save();
  }

  // Manager edits the appraisal content
  async updateAppraisal(
    id: string,
    dto: UpdateAppraisalRecordDto,
    managerId: string,
  ) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException('Appraisal not found');

    if (record.managerProfileId.toString() !== managerId) {
      throw new ForbiddenException('Not the manager of this employee');
    }

    Object.assign(record, dto);
    return record.save();
  }

  // Manager submits the appraisal (MANAGER_SUBMITTED)
  async updateAppraisalStatus(
    id: string,
    dto: UpdateAppraisalStatusDto,
    managerId: string,
  ) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException('Appraisal not found');

    if (record.managerProfileId.toString() !== managerId) {
      throw new ForbiddenException('You cannot submit this appraisal');
    }

    if (dto.status !== AppraisalRecordStatus.MANAGER_SUBMITTED) {
      throw new ForbiddenException(
        'Managers can ONLY set status = MANAGER_SUBMITTED',
      );
    }

    record.status = AppraisalRecordStatus.MANAGER_SUBMITTED;
    record.managerSubmittedAt = new Date();

    return record.save();
  }

  // HR publishes the appraisal (HR_PUBLISHED)
  async publishAppraisal(
    id: string,
    hrId: string,
    dto: UpdateAppraisalStatusDto,
  ) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException('Appraisal not found');

    if (dto.status !== AppraisalRecordStatus.HR_PUBLISHED) {
      throw new ForbiddenException(
        'HR can ONLY set status = HR_PUBLISHED',
      );
    }

    record.status = AppraisalRecordStatus.HR_PUBLISHED;
    record.hrPublishedAt = new Date();
    record.publishedByEmployeeId = new Types.ObjectId(hrId);

    return record.save();
  }

  // List all appraisals in cycle
  async findCycleAppraisals(cycleId: string) {
  return this.recordModel.find({ cycleId: cycleId }).lean();
}


  // Employee: list my appraisals
  async findMyAppraisals(employeeId: string) {
  return this.recordModel
    .find({ employeeProfileId: employeeId }) // ✅ DON'T convert to ObjectId
    .lean();
}


  // Employee: get one
  async findMyAppraisalById(employeeId: string, recordId: string) {
  const record = await this.recordModel
    .findOne({ _id: recordId, employeeProfileId: employeeId })
    .lean();

  if (!record) throw new NotFoundException("Appraisal not found");
  return record;
}

  // Employee acknowledges appraisal (NO enum value for acknowledge)
 async employeeAcknowledgeAppraisal(
  appraisalId: string,
  employeeId: string,
  comment: string,
) {
  const record = await this.recordModel.findById(appraisalId); // ❌ no .lean()
  if (!record) throw new NotFoundException('Appraisal not found');

  if (record.employeeProfileId.toString() !== employeeId) {
    throw new ForbiddenException('Not your appraisal record');
  }

  record.employeeAcknowledgedAt = new Date();
  record.employeeAcknowledgementComment = comment ?? null;

  await record.save();

  return { message: 'Acknowledgement updated ✅', id: record._id };
}


  // ======================================================
  // DISPUTES
  // ======================================================

 async createDispute(
  appraisalId: string,
  dto: CreateDisputeDto,
  employeeId: string,
) {
  // 1) Get the appraisal record
  const record = await this.recordModel.findById(appraisalId);
  if (!record) throw new NotFoundException('Appraisal not found');

  // 2) Make sure this employee owns this appraisal
  if (record.employeeProfileId.toString() !== employeeId) {
    throw new ForbiddenException('Not your appraisal record');
  }

  // 3) Insert into the DISPUTE collection (correct model!)
  await this.disputeModel.collection.insertOne({
    appraisalId: record._id,
    assignmentId: record.assignmentId,
    cycleId: record.cycleId,
    raisedByEmployeeId: new Types.ObjectId(employeeId),
    reason: dto.reason,
    details: dto.details ?? null,
    status: AppraisalDisputeStatus.OPEN,   // ✅ use enum
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { message: 'Dispute created ✅' };
}

async canRaiseDispute(cycleId: string) {
  const cycle = await this.cycleModel.findById(cycleId);
  if (!cycle) throw new NotFoundException("Cycle not found");

  const now = new Date();
  if (cycle.endDate && now > cycle.endDate) {
    return false;
  }
  return true;
}

  async listDisputes(status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    return this.disputeModel.find(filter).lean();
  }
 async publishCycleResults(id: string) {
  const cycle = await this.cycleModel.findById(id);
  if (!cycle) throw new NotFoundException('Cycle not found');

  cycle.status = AppraisalCycleStatus.CLOSED; // or keep same, depends on flow
  cycle.publishedAt = new Date();
  return cycle.save();
}
async deleteDispute(id: string) {
  const deleted = await this.disputeModel.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundException('Dispute not found');
  return { message: "Dispute deleted ✅", id };
}

  async resolveDispute(
  id: string,
  dto: ResolveDisputeDto,
  hrId: string,
) {
  const dispute = await this.disputeModel.findById(id);
  if (!dispute) throw new NotFoundException('Dispute not found');

  // ✅ The only allowed final status is OPEN or ADJUSTED (your existing enum)
  if (dto.newStatus !== AppraisalDisputeStatus.ADJUSTED)
 {
    throw new ForbiddenException(
      'Since the enum cannot be changed, HR can only resolve by setting status = ADJUSTED',
    );
  }

  dispute.status = AppraisalDisputeStatus.ADJUSTED;
  dispute.resolutionSummary = dto.resolutionSummary;
  dispute.resolvedAt = new Date();
  dispute.resolvedByEmployeeId = new Types.ObjectId(hrId);

  return dispute.save();
}
async getDisputeById(id: string) {
  const dispute = await this.disputeModel.findById(id);
  if (!dispute) throw new NotFoundException('Dispute not found');
  return dispute;
}


}
