import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TimeException,
  TimeExceptionDocument,
} from '../../attendance/schemas/time-exception.schema';
import { TimeExceptionStatus } from '../../enums/index';
import { TimeManagementService } from '../../time-management.service';

// Note: EmployeeSystemRole model would need to be imported from employee-profile module
// For now, we'll use a fallback approach that can be enhanced when modules are integrated
interface EmployeeSystemRole {
  employeeProfileId: Types.ObjectId;
  roles: string[];
  isActive: boolean;
}

@Injectable()
export class ExceptionEscalationSchedulerService {
  private readonly logger = new Logger(ExceptionEscalationSchedulerService.name);

  constructor(
    @InjectModel(TimeException.name)
    private exceptionModel: Model<TimeExceptionDocument>,
    private timeManagementService: TimeManagementService,
    // TODO: Inject EmployeeSystemRole model when employee-profile module is integrated
    // @InjectModel('EmployeeSystemRole')
    // private employeeSystemRoleModel: Model<EmployeeSystemRole>,
  ) {}

  /**
   * Scheduled job to auto-escalate exceptions older than 48 hours
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoEscalation(): Promise<void> {
    this.logger.log('Starting scheduled job: Auto-escalating old exceptions...');

    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() - 48); // 48 hours ago

      // Find exceptions that are OPEN or PENDING and older than 48 hours
      const oldExceptions = await this.exceptionModel
        .find({
          status: {
            $in: [TimeExceptionStatus.OPEN, TimeExceptionStatus.PENDING],
          },
          createdAt: { $lt: deadline },
        })
        .exec();

      let escalatedCount = 0;

      // Find HR Admin or HR Manager users for escalation
      // TODO: When employee-profile module is integrated, uncomment this:
      // const hrAdmins = await this.employeeSystemRoleModel.find({
      //   roles: { $in: ['HR Admin', 'HR Manager', 'System Admin'] },
      //   isActive: true,
      // }).populate('employeeProfileId').exec();
      // const hrAdminId = hrAdmins.length > 0 
      //   ? hrAdmins[0].employeeProfileId.toString()
      //   : null;

      for (const exception of oldExceptions) {
        try {
          // Try to find an HR Admin/Manager to escalate to
          // Priority: 1) Exception's assignedTo, 2) Find HR Admin by role, 3) Default fallback
          let hrAdminId: string | null = null;

          // First, check if exception already has an assignedTo (manager/HR)
          if (exception.assignedTo) {
            hrAdminId = exception.assignedTo instanceof Types.ObjectId
              ? exception.assignedTo.toString()
              : String(exception.assignedTo);
          } else {
            // TODO: When employee-profile module is integrated, use this:
            // if (hrAdmins && hrAdmins.length > 0) {
            //   // Use first available HR Admin/Manager
            //   hrAdminId = hrAdmins[0].employeeProfileId.toString();
            // } else {
            //   // Fallback: Use system default (should be configured in production)
            //   hrAdminId = '000000000000000000000000';
            // }
            
            // For now, use fallback until employee-profile module is integrated
            hrAdminId = '000000000000000000000000'; // System default HR Admin ID
            this.logger.warn(
              `No HR Admin found by role for exception ${exception._id}, using default. ` +
              `TODO: Integrate EmployeeSystemRole model to find actual HR Admin users.`
            );
          }

          if (!hrAdminId) {
            this.logger.error(
              `Cannot escalate exception ${exception._id}: No HR Admin ID available`
            );
            continue;
          }

          // Escalate the exception
          await this.timeManagementService.escalateException(
            exception._id.toString(),
            hrAdminId,
            'Auto-escalated: No action taken within 48 hours',
          );

          escalatedCount++;
          this.logger.log(
            `Escalated exception ${exception._id} to HR Admin`,
          );
        } catch (error) {
          this.logger.error(
            `Error escalating exception ${exception._id}: ${error.message}`,
          );
        }
      }

      if (escalatedCount > 0) {
        this.logger.log(
          `Auto-escalated ${escalatedCount} exception(s) to HR Admin`,
        );
      } else {
        this.logger.log('No exceptions needed escalation');
      }
    } catch (error) {
      this.logger.error(
        `Error in auto-escalation job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerEscalation(): Promise<number> {
    this.logger.log('Manually triggering exception escalation...');
    await this.handleAutoEscalation();
    return 0; // Return count of escalated exceptions
  }
}

