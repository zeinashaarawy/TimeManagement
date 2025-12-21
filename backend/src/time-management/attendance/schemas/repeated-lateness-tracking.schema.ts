import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type RepeatedLatenessTrackingDocument =
  HydratedDocument<RepeatedLatenessTracking>;

/**
 * Repeated Lateness Tracking Schema
 * Tracks cumulative lateness incidents for employees to enable
 * threshold-based escalation and disciplinary action.
 */
@Schema({ timestamps: true })
export class RepeatedLatenessTracking {
  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  periodStart: Date; // Start of tracking period (week/month)

  @Prop({ required: true })
  periodEnd: Date; // End of tracking period

  @Prop({ required: true, enum: ['WEEK', 'MONTH'] })
  periodType: string; // WEEK or MONTH

  @Prop({ default: 0 })
  totalLatenessIncidents: number; // Count of late arrivals in period

  @Prop({ default: 0 })
  totalLatenessMinutes: number; // Total minutes late in period

  @Prop({ default: false })
  thresholdExceeded: boolean; // Whether threshold has been exceeded

  @Prop({ type: Date })
  thresholdExceededAt?: Date; // When threshold was first exceeded

  @Prop({ default: false })
  escalated: boolean; // Whether escalation has been triggered

  @Prop({ type: Date })
  escalatedAt?: Date; // When escalation was triggered

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile' })
  escalatedTo?: Types.ObjectId; // HR/Manager who was notified

  @Prop({ default: false })
  disciplinaryFlag: boolean; // Flag for disciplinary action

  @Prop({ type: Date })
  disciplinaryFlaggedAt?: Date; // When disciplinary flag was set

  @Prop({ type: [Types.ObjectId], ref: 'TimeException', default: [] })
  lateExceptionIds: Types.ObjectId[]; // References to LATE exceptions in this period

  @Prop({ type: Object, default: {} })
  metadata: {
    notes?: string;
    actionTaken?: string;
    resolved?: boolean;
  };
}

export const RepeatedLatenessTrackingSchema =
  SchemaFactory.createForClass(RepeatedLatenessTracking);

// Index for efficient queries
RepeatedLatenessTrackingSchema.index({ employeeId: 1, periodStart: -1 });
RepeatedLatenessTrackingSchema.index({ thresholdExceeded: 1, escalated: -1 });

