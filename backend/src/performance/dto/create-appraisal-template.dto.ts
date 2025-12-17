// src/performance/dto/create-appraisal-template.dto.ts
import { AppraisalTemplateType, AppraisalRatingScaleType } from '../enums/performance.enums';

export class CreateAppraisalTemplateDto {
  // Basic info
  name: string;
  description?: string;
  type: AppraisalTemplateType; // ANNUAL, SEMI_ANNUAL, ...

  // Scope (optional)
  applicableDepartmentIds?: string[];  // ObjectId strings
  applicablePositionIds?: string[];    // ObjectId strings

  // Rating scale
  ratingScaleType: AppraisalRatingScaleType; // e.g. FIVE_POINT, TEN_POINT, etc.

  // Rating scale definition – keep it flexible (matches RatingScaleDefinition in schema)
  ratingScaleDefinition?: {
    label: string;
    minScore?: number;
    maxScore?: number;
    description?: string;
  }[];

  // Evaluation criteria (matches EvaluationCriterion in schema)
  criteria: {
    key: string;         // e.g. "COMMUNICATION"
    title: string;       // e.g. "Communication Skills"
    description?: string;
    weight: number;      // e.g. 20 (for 20%)
    isMandatory?: boolean;
  }[];

  // Flags
  isActive?: boolean;
}
