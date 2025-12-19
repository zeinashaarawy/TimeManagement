import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayrollService } from './payroll.service';
import { Types } from 'mongoose';

@Injectable()
export class PayrollSyncSchedulerService {
  private readonly logger = new Logger(PayrollSyncSchedulerService.name);

  constructor(private readonly payrollService: PayrollService) {}

  /**
   * Scheduled job to sync time data to payroll daily
   * Runs daily at 11:00 PM (before payroll processing)
   */
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async handleDailyPayrollSync(): Promise<void> {
    this.logger.log('Starting scheduled job: Daily payroll sync...');

    try {
      // Calculate period: last 30 days (or current month)
      const periodEnd = new Date();
      periodEnd.setHours(23, 59, 59, 999);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 30);
      periodStart.setHours(0, 0, 0, 0);

      // Validate pre-payroll requirements
      const validation = await this.payrollService.validatePrePayroll(
        periodStart,
        periodEnd,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Pre-payroll validation failed: ${validation.issues.join(', ')}`,
        );
        this.logger.warn(
          'Payroll sync skipped due to validation issues. Please resolve pending items.',
        );
        return;
      }

      // Perform sync
      const syncResult = await this.payrollService.syncPayroll(
        periodStart,
        periodEnd,
        new Types.ObjectId('000000000000000000000000'), // System user for automated sync
      );

      this.logger.log(
        `Daily payroll sync completed. Sync ID: ${syncResult._id}`,
      );
      this.logger.log(
        `Synced ${syncResult.payloadSummary?.totalRecords || 0} attendance records`,
      );
      this.logger.log(
        `Total employees: ${syncResult.payloadSummary?.totalEmployees || 0}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in daily payroll sync: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerSync(
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<any> {
    this.logger.log('Manually triggering payroll sync...');

    const start = periodStart || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    const end = periodEnd || (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    return this.payrollService.syncPayroll(
      start,
      end,
      new Types.ObjectId('000000000000000000000000'), // System user for manual sync
    );
  }
}

