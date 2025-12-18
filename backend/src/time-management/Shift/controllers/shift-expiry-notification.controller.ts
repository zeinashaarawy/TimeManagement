import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ShiftExpiryService } from '../services/shift-expiry.service';
import { ShiftExpirySchedulerService } from '../services/shift-expiry-scheduler.service';
import { ShiftExpiryNotificationResponseDto } from '../dto/shift-expiry-notification-response.dto';
import { ResolveNotificationDto } from '../dto/resolve-notification.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('notifications')
@Controller('time-management/notifications')
@UseGuards(RolesGuard)
export class ShiftExpiryNotificationController {
  private readonly logger = new Logger(ShiftExpiryNotificationController.name);

  constructor(
    private readonly shiftExpiryService: ShiftExpiryService,
    private readonly shiftExpirySchedulerService: ShiftExpirySchedulerService,
  ) {}

  /**
   * Get all shift expiry notifications
   * GET /time-management/notifications/shifts
   */
  @Get('shifts')
  @Roles('HR_ADMIN', 'HR Manager', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get all shift expiry notifications' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by notification status',
    enum: ['pending', 'sent', 'acknowledged', 'resolved'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of expiry notifications',
    type: [ShiftExpiryNotificationResponseDto],
  })
  async getNotifications(@Query('status') status?: string) {
    this.logger.log('=== GET NOTIFICATIONS ENDPOINT CALLED ===');
    this.logger.log('Status filter:', status || 'none');

    try {
      this.logger.log('Calling shiftExpiryService.getNotifications...');
      const notifications =
        await this.shiftExpiryService.getNotifications(status);
      this.logger.log(
        'Service returned notifications count:',
        notifications?.length || 0,
      );

      // Ensure it's an array
      if (!Array.isArray(notifications)) {
        this.logger.error(
          'Service did not return an array! Type:',
          typeof notifications,
        );
        return [];
      }

      // Try to serialize to ensure it's valid JSON
      try {
        const jsonString = JSON.stringify(notifications);
        this.logger.log(
          '✅ Notifications are JSON-serializable, JSON length:',
          jsonString.length,
        );
      } catch (serializeError: any) {
        this.logger.error('❌ Notifications are NOT JSON-serializable!');
        this.logger.error('Serialize error message:', serializeError?.message);
        this.logger.error('Serialize error stack:', serializeError?.stack);
        if (notifications.length > 0) {
          this.logger.error(
            'First notification sample:',
            JSON.stringify(notifications[0], null, 2),
          );
        }
        // Return empty array if serialization fails
        return [];
      }

      // Final check before returning
      const result = Array.isArray(notifications) ? notifications : [];
      this.logger.log('✅ Returning notifications count:', result.length);
      this.logger.log('=== GET NOTIFICATIONS ENDPOINT SUCCESS ===');
      return result;
    } catch (error: any) {
      this.logger.error(
        '❌❌❌ CRITICAL ERROR in getNotifications controller ❌❌❌',
      );
      this.logger.error('Error type:', error?.constructor?.name);
      this.logger.error('Error message:', error?.message);
      this.logger.error('Error name:', error?.name);
      this.logger.error('Error stack:', error?.stack);
      // Return empty array on error to prevent 500 - this should never happen if service handles errors
      this.logger.log('Returning empty array due to error');
      return [];
    }
  }

  /**
   * Manually trigger expiry detection (for testing)
   * POST /time-management/notifications/shifts/detect
   * This endpoint manually triggers the expiry detection job that normally runs at 9 AM daily
   */
  @Post('shifts/detect')
  @Roles('HR_ADMIN', 'HR Manager', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger expiry detection',
    description:
      'Manually trigger the expiry detection job to create notifications for shifts/assignments expiring within the specified days. Normally runs automatically at 9 AM daily.',
  })
  @ApiQuery({
    name: 'daysBeforeExpiry',
    required: false,
    description: 'Number of days before expiry to detect (default: 30)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Expiry detection completed',
    schema: {
      type: 'object',
      properties: {
        notificationsCreated: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async triggerDetection(@Query('daysBeforeExpiry') daysBeforeExpiry?: number) {
    this.logger.log('🚀 triggerDetection endpoint called!');
    this.logger.log(`   Query param daysBeforeExpiry: ${daysBeforeExpiry}`);

    try {
      const days = daysBeforeExpiry
        ? parseInt(daysBeforeExpiry.toString(), 10)
        : 30;
      this.logger.log(`   Using ${days} days before expiry`);

      this.logger.log(
        '   Calling shiftExpirySchedulerService.triggerExpiryDetection...',
      );
      const count =
        await this.shiftExpirySchedulerService.triggerExpiryDetection(days);

      this.logger.log(
        `   ✅ Detection completed. Created ${count} notifications`,
      );

      return {
        notificationsCreated: count,
        message: `Expiry detection completed. Created ${count} new notification(s) for shifts/assignments expiring within ${days} days.`,
      };
    } catch (error: any) {
      this.logger.error('   ❌ Error in triggerDetection:', error);
      this.logger.error('   Error message:', error?.message);
      this.logger.error('   Error stack:', error?.stack);
      throw error;
    }
  }

  /**
   * Resolve an expiry notification
   * PATCH /time-management/notifications/shifts/:id/resolve
   */
  @Patch('shifts/:id/resolve')
  @Roles('HR_ADMIN', 'HR Manager', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve an expiry notification',
    description:
      'Mark an expiry notification as resolved. This is typically done after renewing or replacing the expiring shift/assignment.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiBody({ type: ResolveNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Notification resolved successfully',
    type: ShiftExpiryNotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async resolveNotification(
    @Param('id') id: string,
    @Body() resolveDto: ResolveNotificationDto,
  ) {
    return await this.shiftExpiryService.resolveNotification(
      id,
      resolveDto.resolutionNotes,
    );
  }
}
