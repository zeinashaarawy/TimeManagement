import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../../Shift/schemas/schedule-assignment.schema';
import { ShiftTemplate, ShiftTemplateDocument } from '../../Shift/schemas/shift.schema';

@Injectable()
export class ScheduleHelperService {
  constructor(
    @InjectModel(ScheduleAssignment.name)
    private scheduleAssignmentModel: Model<ScheduleAssignmentDocument>,
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,
  ) {}

  /**
   * Get scheduled shift times for an employee on a specific date
   * Returns: { startTime, endTime, scheduledMinutes, shiftTemplate }
   */
  async getScheduledTimes(
    employeeId: Types.ObjectId,
    date: Date,
  ): Promise<{
    startTime?: Date;
    endTime?: Date;
    scheduledMinutes?: number;
    shiftTemplate?: ShiftTemplateDocument;
    punchPolicy?: string;
  }> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Find active assignment for this employee on this date
    const assignment = await this.scheduleAssignmentModel
      .findOne({
        employeeId,
        status: 'Active',
        effectiveFrom: { $lte: dateEnd },
        $or: [
          { effectiveTo: null },
          { effectiveTo: { $gte: dateOnly } },
        ],
      })
      .populate('shiftTemplateId')
      .sort({ effectiveFrom: -1 }) // Get most recent assignment
      .exec();

    if (!assignment || !assignment.shiftTemplateId) {
      return {};
    }

    // Get shift template (populated or fetch separately)
    let shiftTemplate: ShiftTemplateDocument | null = null;
    if (assignment.shiftTemplateId instanceof Types.ObjectId) {
      shiftTemplate = await this.shiftTemplateModel.findById(assignment.shiftTemplateId).exec();
    } else {
      // Already populated
      shiftTemplate = assignment.shiftTemplateId as unknown as ShiftTemplateDocument;
    }

    if (!shiftTemplate) {
      return {};
    }

    // Parse start and end times from shift template
    let startTime: Date | undefined;
    let endTime: Date | undefined;
    let scheduledMinutes: number | undefined;

    if (shiftTemplate.startTime && shiftTemplate.endTime) {
      const [startHour, startMin] = shiftTemplate.startTime.split(':').map(Number);
      const [endHour, endMin] = shiftTemplate.endTime.split(':').map(Number);

      startTime = new Date(dateOnly);
      startTime.setHours(startHour, startMin, 0, 0);

      endTime = new Date(dateOnly);
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts
      if (shiftTemplate.isOvernight && endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      scheduledMinutes = Math.floor(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60),
      );
    } else if (shiftTemplate.type === 'flexible' && shiftTemplate.requiredHours) {
      scheduledMinutes = shiftTemplate.requiredHours * 60;
    } else if (
      shiftTemplate.type === 'compressed' &&
      shiftTemplate.hoursPerDay
    ) {
      scheduledMinutes = shiftTemplate.hoursPerDay * 60;
    }

    return {
      startTime,
      endTime,
      scheduledMinutes,
      shiftTemplate,
      punchPolicy: 'FIRST_LAST', // Default, can be extended later
    };
  }
}

