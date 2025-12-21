import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Punch, PunchDocument } from '../../attendance/schemas/punch.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { PunchType } from '../../enums/index';

/**
 * Device Sync Service
 * Implements BR-TM-13: Device synchronization
 * 
 * Handles:
 * - Offline punch queuing
 * - Device reconnection sync
 * - Automatic sync when device comes online
 */
@Injectable()
export class DeviceSyncService {
  private readonly logger = new Logger(DeviceSyncService.name);
  
  // In-memory queue for offline punches (in production, use Redis or database)
  private offlinePunchQueue: Map<string, Array<{
    employeeId: string;
    timestamp: Date;
    type: 'in' | 'out';
    device: string;
    location?: string;
    rawMetadata?: Record<string, any>;
  }>> = new Map();

  constructor(
    @InjectModel(Punch.name)
    private punchModel: Model<PunchDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
  ) {}

  /**
   * Queue a punch when device is offline
   * BR-TM-13: Attendance devices must sync automatically once reconnected online
   */
  async queueOfflinePunch(
    employeeId: string,
    timestamp: Date,
    type: 'in' | 'out',
    device: string,
    location?: string,
    rawMetadata?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(`Queueing offline punch for employee ${employeeId} on device ${device}`);

    const deviceKey = device || 'unknown';
    if (!this.offlinePunchQueue.has(deviceKey)) {
      this.offlinePunchQueue.set(deviceKey, []);
    }

    const queue = this.offlinePunchQueue.get(deviceKey)!;
    queue.push({
      employeeId,
      timestamp,
      type,
      device,
      location,
      rawMetadata,
    });

    this.logger.log(`Queued punch. Queue size for device ${deviceKey}: ${queue.length}`);
  }

  /**
   * Sync all queued punches when device reconnects
   * BR-TM-13: Attendance devices must sync automatically once reconnected online
   */
  async syncDevicePunches(device: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    this.logger.log(`Syncing punches for device ${device}`);

    const deviceKey = device || 'unknown';
    const queue = this.offlinePunchQueue.get(deviceKey);
    
    if (!queue || queue.length === 0) {
      this.logger.log(`No queued punches for device ${deviceKey}`);
      return { synced: 0, failed: 0, errors: [] };
    }

    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    // Process all queued punches
    for (const punchData of queue) {
      try {
        await this.syncPunch(punchData);
        synced++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to sync punch for employee ${punchData.employeeId}: ${error.message}`);
        this.logger.error(`Failed to sync punch: ${error.message}`, error.stack);
      }
    }

    // Clear queue after sync
    this.offlinePunchQueue.delete(deviceKey);

    this.logger.log(
      `Sync complete for device ${deviceKey}: ${synced} synced, ${failed} failed`,
    );

    return { synced, failed, errors };
  }

  /**
   * Sync a single punch to the database
   */
  private async syncPunch(punchData: {
    employeeId: string;
    timestamp: Date;
    type: 'in' | 'out';
    device: string;
    location?: string;
    rawMetadata?: Record<string, any>;
  }): Promise<void> {
    const employeeObjectId = new Types.ObjectId(punchData.employeeId);
    const punchTime = new Date(punchData.timestamp);

    // Prepare day boundaries
    const startOfDay = new Date(punchTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(punchTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Find or create attendance record
    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      recordDate: {
        $gte: startOfDay,
        $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        recordDate: startOfDay,
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: false,
      });
    }

    // Add punch to attendance record
    attendance.punches.push({
      type: punchData.type.toUpperCase() === 'IN' ? PunchType.IN : PunchType.OUT,
      time: punchTime,
    });

    // Recalculate worked minutes
    attendance.totalWorkMinutes = this.calculateWorkedMinutes(attendance.punches);

    // Check for missed punches
    const hasInPunch = attendance.punches.some((p) => p.type === 'IN');
    const hasOutPunch = attendance.punches.some((p) => p.type === 'OUT');
    attendance.hasMissedPunch = !hasInPunch || !hasOutPunch;

    // Save attendance record
    await attendance.save();

    // Also save punch record separately for audit
    const punch = new this.punchModel({
      employeeId: punchData.employeeId,
      timestamp: punchTime,
      type: punchData.type,
      device: punchData.device,
      location: punchData.location,
      rawMetadata: {
        ...punchData.rawMetadata,
        syncedAt: new Date(),
        syncedFromOffline: true,
      },
    });

    await punch.save();

    this.logger.log(
      `Synced punch for employee ${punchData.employeeId} at ${punchTime.toISOString()}`,
    );
  }

  /**
   * Calculate worked minutes from punches (simplified version)
   */
  private calculateWorkedMinutes(
    punches: Array<{ type: string; time: Date }>,
  ): number {
    if (punches.length === 0) return 0;

    const sortedPunches = [...punches].sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );

    const firstIn = sortedPunches.find((p) => p.type === 'IN');
    const lastOut = [...sortedPunches]
      .reverse()
      .find((p) => p.type === 'OUT');

    if (firstIn && lastOut && lastOut.time > firstIn.time) {
      const diffMs = lastOut.time.getTime() - firstIn.time.getTime();
      return Math.floor(diffMs / (1000 * 60));
    }

    return 0;
  }

  /**
   * Get queue status for a device
   */
  getQueueStatus(device: string): { queued: number } {
    const deviceKey = device || 'unknown';
    const queue = this.offlinePunchQueue.get(deviceKey);
    return { queued: queue ? queue.length : 0 };
  }

  /**
   * Get all devices with queued punches
   */
  getDevicesWithQueuedPunches(): string[] {
    return Array.from(this.offlinePunchQueue.keys());
  }
}

