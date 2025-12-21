import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../../../employee-profile/models/employee-profile.schema';
import { TimePolicy, TimePolicyDocument, PermissionValidationRuleConfig } from '../../policy/schemas/time-policy.schema';
import { TimeException, TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
import { PermissionType } from '../../enums/index';

/**
 * Permission Validation Service
 * Implements BR-TM-16, BR-TM-17, BR-TM-18: Permission validation rules
 * 
 * Validates:
 * - Permission duration limits (BR-TM-16)
 * - Date validation (contract start, financial calendar, probation) (BR-TM-17)
 * - Payroll and benefits impact tracking (BR-TM-18)
 */
@Injectable()
export class PermissionValidationService {
  private readonly logger = new Logger(PermissionValidationService.name);

  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(TimePolicy.name)
    private policyModel: Model<TimePolicyDocument>,
    @InjectModel(TimeException.name)
    private exceptionModel: Model<TimeExceptionDocument>,
  ) {}

  /**
   * Validate a permission request
   * @param employeeId Employee requesting permission
   * @param permissionType Type of permission
   * @param durationMinutes Duration in minutes
   * @param requestedDate Date for which permission is requested
   * @returns Validation result with any errors
   */
  async validatePermission(
    employeeId: Types.ObjectId,
    permissionType: PermissionType,
    durationMinutes: number,
    requestedDate: Date,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    payrollImpact?: {
      affectsPayroll: boolean;
      impactType: 'OVERTIME' | 'SHORT_TIME' | 'ADJUSTMENT' | 'NONE';
      impactAmount?: number;
    };
    benefitsImpact?: {
      affectsBenefits: boolean;
      impactType: 'ACCRUAL' | 'DEDUCTION' | 'NONE';
      impactAmount?: number;
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get employee profile
    const employee = await this.employeeModel.findById(employeeId).exec();
    if (!employee) {
      throw new BadRequestException(`Employee with ID ${employeeId} not found`);
    }

    // Get applicable policy
    const policy = await this.getApplicablePolicy(employeeId, requestedDate);
    if (!policy || !policy.permissionValidationRule) {
      warnings.push('No permission validation rules configured. Using default validation.');
      return {
        valid: true,
        errors: [],
        warnings,
      };
    }

    const validationRule = policy.permissionValidationRule;

    // 1. Validate duration limits (BR-TM-16)
    const durationValidation = this.validateDuration(
      permissionType,
      durationMinutes,
      validationRule,
    );
    if (!durationValidation.valid) {
      errors.push(...durationValidation.errors);
    }

    // 2. Validate dates (BR-TM-17)
    const dateValidation = await this.validateDates(
      employee,
      requestedDate,
      validationRule,
    );
    if (!dateValidation.valid) {
      errors.push(...dateValidation.errors);
    }

    // 3. Calculate payroll and benefits impact (BR-TM-18)
    const payrollImpact = this.calculatePayrollImpact(
      permissionType,
      durationMinutes,
      validationRule,
    );
    const benefitsImpact = this.calculateBenefitsImpact(
      permissionType,
      durationMinutes,
      validationRule,
    );

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      payrollImpact,
      benefitsImpact,
    };
  }

  /**
   * Validate permission duration against limits (BR-TM-16)
   */
  private validateDuration(
    permissionType: PermissionType,
    durationMinutes: number,
    rule: PermissionValidationRuleConfig,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.maxDurationMinutes) {
      return { valid: true, errors: [] };
    }

    const maxDuration = rule.maxDurationMinutes[permissionType];
    if (maxDuration && durationMinutes > maxDuration) {
      errors.push(
        `Permission duration (${durationMinutes} minutes) exceeds maximum allowed (${maxDuration} minutes) for ${permissionType}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate dates against contract start, financial calendar, and probation (BR-TM-17)
   */
  private async validateDates(
    employee: EmployeeProfileDocument,
    requestedDate: Date,
    rule: PermissionValidationRuleConfig,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate contract start date
    if (rule.requireContractStartDate) {
      if (!employee.contractStartDate) {
        errors.push('Employee contract start date is not set');
      } else if (requestedDate < employee.contractStartDate) {
        errors.push(
          `Requested date (${requestedDate.toISOString()}) is before contract start date (${employee.contractStartDate.toISOString()})`,
        );
      }
    }

    // Validate financial calendar (assuming financial year starts Jan 1)
    // TODO: Integrate with actual financial calendar module if available
    if (rule.requireFinancialCalendar) {
      const financialYearStart = new Date(requestedDate.getFullYear(), 0, 1);
      const financialYearEnd = new Date(requestedDate.getFullYear(), 11, 31);
      
      if (requestedDate < financialYearStart || requestedDate > financialYearEnd) {
        errors.push(
          `Requested date (${requestedDate.toISOString()}) is outside the financial calendar year`,
        );
      }
    }

    // Validate probation period (assuming 3 months probation from contract start)
    // TODO: Get actual probation period from employee profile or configuration
    if (rule.requireProbationEndDate) {
      if (!employee.contractStartDate) {
        errors.push('Employee contract start date is not set');
      } else {
        const probationEndDate = new Date(employee.contractStartDate);
        probationEndDate.setMonth(probationEndDate.getMonth() + 3); // Default 3 months
        
        if (requestedDate < probationEndDate) {
          errors.push(
            `Requested date (${requestedDate.toISOString()}) is before probation period ends (${probationEndDate.toISOString()})`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate payroll impact (BR-TM-18)
   */
  private calculatePayrollImpact(
    permissionType: PermissionType,
    durationMinutes: number,
    rule: PermissionValidationRuleConfig,
  ): {
    affectsPayroll: boolean;
    impactType: 'OVERTIME' | 'SHORT_TIME' | 'ADJUSTMENT' | 'NONE';
    impactAmount?: number;
  } {
    if (!rule.affectsPayroll) {
      return {
        affectsPayroll: false,
        impactType: 'NONE',
      };
    }

    let impactType: 'OVERTIME' | 'SHORT_TIME' | 'ADJUSTMENT' | 'NONE' = 'NONE';
    
    switch (permissionType) {
      case PermissionType.LATE_OUT:
      case PermissionType.OUT_OF_HOURS:
        impactType = rule.payrollImpactType || 'OVERTIME';
        break;
      case PermissionType.EARLY_IN:
        impactType = rule.payrollImpactType || 'ADJUSTMENT';
        break;
      case PermissionType.TOTAL:
        impactType = rule.payrollImpactType || 'ADJUSTMENT';
        break;
    }

    // Calculate impact amount (simplified - should integrate with actual payroll calculation)
    let impactAmount: number | undefined;
    if (impactType !== 'NONE') {
      // Base calculation: assume 1 unit per minute (should be replaced with actual rate)
      impactAmount = durationMinutes;
    }

    return {
      affectsPayroll: true,
      impactType: rule.payrollImpactType || impactType,
      impactAmount,
    };
  }

  /**
   * Calculate benefits impact (BR-TM-18)
   */
  private calculateBenefitsImpact(
    permissionType: PermissionType,
    durationMinutes: number,
    rule: PermissionValidationRuleConfig,
  ): {
    affectsBenefits: boolean;
    impactType: 'ACCRUAL' | 'DEDUCTION' | 'NONE';
    impactAmount?: number;
  } {
    if (!rule.affectsBenefits) {
      return {
        affectsBenefits: false,
        impactType: 'NONE',
      };
    }

    const impactType = rule.benefitsImpactType || 'NONE';
    
    // Calculate impact amount (simplified - should integrate with actual benefits calculation)
    let impactAmount: number | undefined;
    if (impactType !== 'NONE') {
      // Base calculation: assume 1 unit per minute (should be replaced with actual rate)
      impactAmount = durationMinutes;
    }

    return {
      affectsBenefits: true,
      impactType,
      impactAmount,
    };
  }

  /**
   * Get applicable policy for employee
   */
  private async getApplicablePolicy(
    employeeId: Types.ObjectId,
    date: Date,
  ): Promise<TimePolicyDocument | null> {
    // Try employee-specific policy first
    const employeePolicy = await this.policyModel
      .findOne({
        employeeId,
        active: true,
        $or: [
          { effectiveFrom: { $lte: date }, effectiveTo: null },
          { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    if (employeePolicy) {
      return employeePolicy;
    }

    // Try department policy
    const employee = await this.employeeModel.findById(employeeId).exec();
    if (employee?.primaryDepartmentId) {
      const departmentPolicy = await this.policyModel
        .findOne({
          departmentId: employee.primaryDepartmentId,
          active: true,
          $or: [
            { effectiveFrom: { $lte: date }, effectiveTo: null },
            { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
          ],
        })
        .sort({ createdAt: -1 })
        .exec();

      if (departmentPolicy) {
        return departmentPolicy;
      }
    }

    // Try global policy
    const globalPolicy = await this.policyModel
      .findOne({
        scope: 'GLOBAL',
        active: true,
        $or: [
          { effectiveFrom: { $lte: date }, effectiveTo: null },
          { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    return globalPolicy;
  }

  /**
   * Update exception with validation results and impact
   */
  async updateExceptionWithValidation(
    exceptionId: Types.ObjectId,
    validationResult: Awaited<ReturnType<typeof this.validatePermission>>,
  ): Promise<TimeExceptionDocument> {
    const exception = await this.exceptionModel.findById(exceptionId).exec();
    if (!exception) {
      throw new BadRequestException(`Exception with ID ${exceptionId} not found`);
    }

    // Update validation flags based on actual validation results
    // These should be set based on whether validation was performed and passed
    // For now, we set them to true if validation passed (no errors)
    if (validationResult.valid) {
      exception.contractStartDateValidated = true;
      exception.financialCalendarValidated = true;
      exception.probationDateValidated = true;
    }

    // Update payroll and benefits impact
    if (validationResult.payrollImpact) {
      exception.affectsPayroll = validationResult.payrollImpact.affectsPayroll;
      exception.payrollImpactType = validationResult.payrollImpact.impactType;
      exception.payrollImpactAmount = validationResult.payrollImpact.impactAmount;
    }

    if (validationResult.benefitsImpact) {
      exception.affectsBenefits = validationResult.benefitsImpact.affectsBenefits;
      exception.benefitsImpactType = validationResult.benefitsImpact.impactType;
      exception.benefitsImpactAmount = validationResult.benefitsImpact.impactAmount;
    }

    return exception.save();
  }
}

