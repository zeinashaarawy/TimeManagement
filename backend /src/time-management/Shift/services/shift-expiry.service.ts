import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ShiftExpiryNotification,
  ShiftExpiryNotificationDocument,
} from '../schemas/shift-expiry-notification.schema';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';

@Injectable()
export class ShiftExpiryService {
  private readonly logger = new Logger(ShiftExpiryService.name);

  constructor(
    @InjectModel(ShiftExpiryNotification.name)
    private shiftExpiryNotificationModel: Model<ShiftExpiryNotificationDocument>,
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,
    @InjectModel(ScheduleAssignment.name)
    private scheduleAssignmentModel: Model<ScheduleAssignmentDocument>,
  ) {}

  /**
   * Get all shift expiry notifications
   */
  async getNotifications(status?: string): Promise<any[]> {
    try {
      // Check if model is available
      if (!this.shiftExpiryNotificationModel) {
        this.logger.error('shiftExpiryNotificationModel is not injected');
        return [];
      }

      const query: any = {};
      if (status) {
        query.status = status;
      }

      this.logger.log('Querying notifications with query:', query);

      // Find notifications - use lean() to get plain objects
      let notifications: any[] = [];
      try {
        const result = await this.shiftExpiryNotificationModel
          .find(query)
          .lean()
          .exec();
        notifications = result || [];

        this.logger.log(`Found ${notifications.length} raw notifications`);

        // If we got results, sort them manually
        if (notifications.length > 0) {
          notifications = notifications.sort((a: any, b: any) => {
            const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
            const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
            return dateA - dateB;
          });
        }
      } catch (findError: any) {
        this.logger.error('Find failed:', findError);
        this.logger.error('Find error details:', {
          message: findError?.message,
          stack: findError?.stack,
          name: findError?.name,
        });
        return [];
      }

      this.logger.log('Found notifications count:', notifications?.length || 0);

      // If no notifications, return early
      if (notifications.length === 0) {
        this.logger.log('No notifications to transform, returning empty array');
        return [];
      }

      // Simple, safe transformation - manually convert each field
      // This avoids JSON.stringify issues with circular references or special objects
      this.logger.log('Starting transformation of notifications...');
      const transformedNotifications: any[] = [];

      for (let i = 0; i < notifications.length; i++) {
        const n = notifications[i];
        try {
          this.logger.log(
            `Transforming notification ${i + 1}/${notifications.length}, ID: ${n._id}`,
          );

          const transformed: any = {
            _id: n._id ? String(n._id) : 'unknown',
            status: n.status || 'pending',
            notificationSent: Boolean(n.notificationSent),
            notifiedTo: Array.isArray(n.notifiedTo)
              ? n.notifiedTo
                  .map((id: any) => {
                    try {
                      return String(id);
                    } catch {
                      return null;
                    }
                  })
                  .filter(Boolean)
              : [],
          };

          // Convert optional ObjectId fields - handle both ObjectId objects and strings
          if (n.shiftTemplateId) {
            try {
              transformed.shiftTemplateId = String(n.shiftTemplateId);
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert shiftTemplateId for notification ${n._id}:`,
                err,
              );
            }
          }
          if (n.scheduleAssignmentId) {
            try {
              transformed.scheduleAssignmentId = String(n.scheduleAssignmentId);
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert scheduleAssignmentId for notification ${n._id}:`,
                err,
              );
            }
          }

          // Convert date fields - handle both Date objects and strings
          if (n.expiryDate) {
            try {
              transformed.expiryDate =
                n.expiryDate instanceof Date
                  ? n.expiryDate.toISOString()
                  : new Date(n.expiryDate).toISOString();
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert expiryDate for notification ${n._id}:`,
                err,
              );
              transformed.expiryDate = null;
            }
          }
          if (n.notificationSentAt) {
            try {
              transformed.notificationSentAt =
                n.notificationSentAt instanceof Date
                  ? n.notificationSentAt.toISOString()
                  : new Date(n.notificationSentAt).toISOString();
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert notificationSentAt for notification ${n._id}:`,
                err,
              );
            }
          }
          if (n.resolvedAt) {
            try {
              transformed.resolvedAt =
                n.resolvedAt instanceof Date
                  ? n.resolvedAt.toISOString()
                  : new Date(n.resolvedAt).toISOString();
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert resolvedAt for notification ${n._id}:`,
                err,
              );
            }
          }
          if (n.createdAt) {
            try {
              transformed.createdAt =
                n.createdAt instanceof Date
                  ? n.createdAt.toISOString()
                  : new Date(n.createdAt).toISOString();
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert createdAt for notification ${n._id}:`,
                err,
              );
            }
          }
          if (n.updatedAt) {
            try {
              transformed.updatedAt =
                n.updatedAt instanceof Date
                  ? n.updatedAt.toISOString()
                  : new Date(n.updatedAt).toISOString();
            } catch (err: any) {
              this.logger.warn(
                `Failed to convert updatedAt for notification ${n._id}:`,
                err,
              );
            }
          }

          // Copy string fields as-is
          if (n.resolutionNotes) {
            transformed.resolutionNotes = String(n.resolutionNotes);
          }

          // Test serialization of this single notification
          try {
            JSON.stringify(transformed);
            this.logger.log(`✅ Notification ${i + 1} is JSON-serializable`);
          } catch (serializeErr: any) {
            this.logger.error(
              `❌ Notification ${i + 1} is NOT JSON-serializable:`,
              serializeErr,
            );
            this.logger.error(`   Notification data:`, transformed);
            // Still add it, but log the error
          }

          transformedNotifications.push(transformed);
        } catch (err: any) {
          this.logger.error(`Error transforming notification ${i + 1}:`, err);
          this.logger.error('Notification raw data:', n);
          // Return a minimal valid object instead of skipping
          transformedNotifications.push({
            _id: n._id ? String(n._id) : 'unknown',
            status: 'pending',
            notificationSent: false,
            notifiedTo: [],
          });
        }
      }

      this.logger.log(
        `Successfully transformed ${transformedNotifications.length} notifications`,
      );

      // Final test - try to serialize the entire array
      try {
        const testJson = JSON.stringify(transformedNotifications);
        this.logger.log(
          `✅ All ${transformedNotifications.length} notifications are JSON-serializable (${testJson.length} bytes)`,
        );
      } catch (finalErr: any) {
        this.logger.error(`❌ Final serialization test failed:`, finalErr);
        this.logger.error(`   Error message:`, finalErr?.message);
        // Return empty array if final serialization fails
        return [];
      }

      return transformedNotifications;
    } catch (error: any) {
      this.logger.error('Error fetching notifications:', error);
      this.logger.error('Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        modelAvailable: !!this.shiftExpiryNotificationModel,
      });
      // Return empty array on error instead of throwing to prevent 500
      // This allows the frontend to handle empty state gracefully
      return [];
    }
  }

  /**
   * Resolve an expiry notification (mark as resolved with optional notes)
   */
  async resolveNotification(
    id: string,
    resolutionNotes?: string,
  ): Promise<ShiftExpiryNotificationDocument> {
    if (!this.shiftExpiryNotificationModel) {
      throw new Error('shiftExpiryNotificationModel is not injected');
    }

    const notification = await this.shiftExpiryNotificationModel
      .findById(id)
      .exec();

    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    // Update notification status to resolved
    notification.status = 'resolved';
    notification.resolvedAt = new Date();
    if (resolutionNotes) {
      notification.resolutionNotes = resolutionNotes;
    }

    return await notification.save();
  }

  /**
   * Detect expiring shifts and create notifications (called by scheduled job)
   */
  async detectExpiringShifts(daysBeforeExpiry: number = 30): Promise<number> {
    this.logger.log('🔍 detectExpiringShifts method called!');
    this.logger.log(`   Parameter daysBeforeExpiry: ${daysBeforeExpiry}`);

    // Set today to start of day (00:00:00) for accurate date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Set expiry threshold to end of day (23:59:59) 30 days from now
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + daysBeforeExpiry);
    expiryThreshold.setHours(23, 59, 59, 999);

    this.logger.log('🔍 Starting expiry detection');
    this.logger.log(`  Today: ${today.toISOString()}`);
    this.logger.log(
      `  Threshold (${daysBeforeExpiry} days): ${expiryThreshold.toISOString()}`,
    );

    this.logger.log('🔍 Expiry Detection - Date Range:');
    this.logger.log(`  Today (start): ${today.toISOString()}`);
    this.logger.log(`  Threshold (end): ${expiryThreshold.toISOString()}`);
    this.logger.log(
      `  Looking for assignments with effectiveTo between these dates`,
    );

    let notificationCount = 0;

    // Check expiring shift templates
    const expiringTemplates = await this.shiftTemplateModel
      .find({
        expirationDate: { $lte: expiryThreshold, $gte: today },
        status: 'Active',
      })
      .exec();

    for (const template of expiringTemplates) {
      // Check if notification already exists
      const existingNotification = await this.shiftExpiryNotificationModel
        .findOne({
          shiftTemplateId: template._id,
          status: { $in: ['pending', 'sent'] },
        })
        .exec();

      if (!existingNotification && template.expirationDate) {
        await this.shiftExpiryNotificationModel.create({
          shiftTemplateId: template._id,
          expiryDate: template.expirationDate,
          notificationSent: false,
          status: 'pending',
        });
        notificationCount++;
      }
    }

    // Check expiring schedule assignments
    // First, let's see ALL active assignments with effectiveTo dates
    const allActiveAssignments = await this.scheduleAssignmentModel
      .find({
        status: 'Active',
        effectiveTo: { $exists: true, $ne: null },
      })
      .exec();

    this.logger.log(
      `📊 Total Active assignments with effectiveTo: ${allActiveAssignments.length}`,
    );
    allActiveAssignments.forEach((assignment) => {
      const effectiveToDate =
        assignment.effectiveTo instanceof Date
          ? assignment.effectiveTo
          : new Date(assignment.effectiveTo);
      const isInRange =
        effectiveToDate &&
        effectiveToDate >= today &&
        effectiveToDate <= expiryThreshold;
      const daysUntilExpiry = effectiveToDate
        ? Math.ceil(
            (effectiveToDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      this.logger.log(`  - Assignment ID: ${assignment._id}`);
      this.logger.log(`    effectiveTo (raw): ${assignment.effectiveTo}`);
      this.logger.log(
        `    effectiveTo (parsed): ${effectiveToDate.toISOString()}`,
      );
      this.logger.log(`    Today: ${today.toISOString()}`);
      this.logger.log(`    Threshold: ${expiryThreshold.toISOString()}`);
      this.logger.log(`    In range? ${isInRange ? '✅ YES' : '❌ NO'}`);
      if (daysUntilExpiry !== null) {
        this.logger.log(`    Days until expiry: ${daysUntilExpiry}`);
      }
    });

    // Now query for expiring assignments
    // MongoDB query: find Active assignments with effectiveTo between today and threshold
    const query = {
      status: 'Active',
      effectiveTo: {
        $exists: true,
        $ne: null,
        $gte: today,
        $lte: expiryThreshold,
      },
    };

    this.logger.log('🔍 Query for expiring assignments:');
    this.logger.log(`  status: 'Active'`);
    this.logger.log(
      `  effectiveTo: { $exists: true, $ne: null, $gte: ${today.toISOString()}, $lte: ${expiryThreshold.toISOString()} }`,
    );

    const expiringAssignments = await this.scheduleAssignmentModel
      .find(query)
      .exec();

    this.logger.log(
      `📋 Query returned ${expiringAssignments.length} expiring assignments`,
    );

    // Log each assignment found by the query
    if (expiringAssignments.length > 0) {
      expiringAssignments.forEach((assignment) => {
        const effectiveToDate =
          assignment.effectiveTo instanceof Date
            ? assignment.effectiveTo
            : new Date(assignment.effectiveTo);
        const daysUntilExpiry = Math.ceil(
          (effectiveToDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        this.logger.log(
          `  ✅ Found: Assignment ${assignment._id}, expires ${effectiveToDate.toISOString()} (${daysUntilExpiry} days)`,
        );
      });
    } else {
      this.logger.log(
        `  ❌ No assignments found by query. Checking all active assignments...`,
      );
    }

    this.logger.log(
      `📋 Found ${expiringAssignments.length} expiring assignments matching query`,
    );
    if (expiringAssignments.length > 0) {
      expiringAssignments.forEach((assignment) => {
        const effectiveToDate =
          assignment.effectiveTo instanceof Date
            ? assignment.effectiveTo
            : new Date(assignment.effectiveTo);
        const daysUntilExpiry = Math.ceil(
          (effectiveToDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        this.logger.log(`  ✅ Assignment ID: ${assignment._id}`);
        this.logger.log(`     effectiveTo: ${effectiveToDate.toISOString()}`);
        this.logger.log(`     status: ${assignment.status}`);
        this.logger.log(`     days until expiry: ${daysUntilExpiry}`);
      });
    } else {
      this.logger.log('❌ No assignments found. Possible reasons:');
      this.logger.log(
        '   1. All assignments have effectiveTo dates in the past',
      );
      this.logger.log(
        '   2. All assignments have effectiveTo dates more than 30 days away',
      );
      this.logger.log('   3. All assignments have status other than "Active"');
      this.logger.log(
        '   4. All assignments have null/undefined effectiveTo dates',
      );
      this.logger.log(
        `   Current date range: ${today.toISOString()} to ${expiryThreshold.toISOString()}`,
      );
    }

    for (const assignment of expiringAssignments) {
      try {
        // Check if notification already exists (only check pending/sent to avoid duplicates)
        const existingNotification = await this.shiftExpiryNotificationModel
          .findOne({
            scheduleAssignmentId: assignment._id,
            status: { $in: ['pending', 'sent'] },
          })
          .exec();

        if (existingNotification) {
          this.logger.log(
            `⏭️  Skipping assignment ${assignment._id} - notification already exists (status: ${existingNotification.status})`,
          );
          continue;
        }

        if (!assignment.effectiveTo) {
          this.logger.log(
            `⏭️  Skipping assignment ${assignment._id} - no effectiveTo date`,
          );
          continue;
        }

        // Ensure effectiveTo is a Date object
        const expiryDate =
          assignment.effectiveTo instanceof Date
            ? assignment.effectiveTo
            : new Date(assignment.effectiveTo);

        // Double-check the date is in range
        if (expiryDate < today || expiryDate > expiryThreshold) {
          this.logger.log(
            `⏭️  Skipping assignment ${assignment._id} - expiry date ${expiryDate.toISOString()} is outside range`,
          );
          continue;
        }

        await this.shiftExpiryNotificationModel.create({
          scheduleAssignmentId: assignment._id,
          expiryDate: expiryDate,
          notificationSent: false,
          status: 'pending',
        });
        notificationCount++;
        this.logger.log(
          `✅ Created notification for assignment ${assignment._id} expiring on ${expiryDate.toISOString()}`,
        );
      } catch (createError: any) {
        this.logger.error(
          `❌ Failed to create notification for assignment ${assignment._id}: ${createError.message}`,
        );
        this.logger.error(`   Error stack: ${createError.stack}`);
      }
    }

    this.logger.log(`🎯 Total notifications created: ${notificationCount}`);

    return notificationCount;
  }
}
