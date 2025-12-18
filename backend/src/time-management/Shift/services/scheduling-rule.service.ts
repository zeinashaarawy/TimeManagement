import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SchedulingRule,
  SchedulingRuleDocument,
} from '../schemas/scheduling-rule.schema';
import { CreateSchedulingRuleDto } from '../dto/create-scheduling-rule.dto';
import { UpdateSchedulingRuleDto } from '../dto/update-scheduling-rule.dto';

@Injectable()
export class SchedulingRuleService {
  constructor(
    @InjectModel(SchedulingRule.name)
    private schedulingRuleModel: Model<SchedulingRuleDocument>,
  ) {}

  async create(createDto: CreateSchedulingRuleDto): Promise<SchedulingRule> {
    // Validate type-specific fields
    if (createDto.type === 'FLEXIBLE') {
      if (!createDto.flexInWindow || !createDto.flexOutWindow) {
        throw new BadRequestException(
          'Flexible rules require flexInWindow and flexOutWindow',
        );
      }
    } else if (createDto.type === 'ROTATIONAL') {
      if (!createDto.rotationalPattern) {
        throw new BadRequestException(
          'Rotational rules require rotationalPattern',
        );
      }
    } else if (createDto.type === 'COMPRESSED') {
      if (!createDto.workDaysPerWeek || !createDto.hoursPerDay) {
        throw new BadRequestException(
          'Compressed rules require workDaysPerWeek and hoursPerDay',
        );
      }
    }

    const schedulingRule = new this.schedulingRuleModel({
      ...createDto,
      active: createDto.active ?? true,
    });

    return schedulingRule.save();
  }

  async findAll(): Promise<SchedulingRule[]> {
    return this.schedulingRuleModel
      .find()
      .populate('departmentIds', 'name code')
      .populate('shiftTemplateIds', 'name type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<SchedulingRule> {
    const rule = await this.schedulingRuleModel
      .findById(id)
      .populate('departmentIds', 'name code')
      .populate('shiftTemplateIds', 'name type')
      .exec();

    if (!rule) {
      throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
    }

    return rule;
  }

  async update(
    id: string,
    updateDto: UpdateSchedulingRuleDto,
  ): Promise<SchedulingRule> {
    const rule = await this.schedulingRuleModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('departmentIds', 'name code')
      .populate('shiftTemplateIds', 'name type')
      .exec();

    if (!rule) {
      throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
    }

    return rule;
  }

  async delete(id: string): Promise<void> {
    const result = await this.schedulingRuleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
    }
  }

  async toggleActive(id: string): Promise<SchedulingRule> {
    const rule = await this.schedulingRuleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
    }
    const updated = await this.schedulingRuleModel
      .findByIdAndUpdate(id, { active: !rule.active }, { new: true })
      .populate('departmentIds', 'name code')
      .populate('shiftTemplateIds', 'name type')
      .exec();
    if (!updated) {
      throw new NotFoundException(`Scheduling rule with ID ${id} not found`);
    }
    return updated;
  }
}
