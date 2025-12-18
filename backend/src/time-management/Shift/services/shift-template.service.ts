import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';
import { CreateShiftTemplateDto } from '../dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from '../dto/update-shift-template.dto';

@Injectable()
export class ShiftTemplateService {
  constructor(
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,
    @InjectModel(ScheduleAssignment.name)
    private scheduleAssignmentModel: Model<ScheduleAssignmentDocument>,
  ) {}

  /**
   * Validate shift template data based on type
   */
  private validateShiftTemplate(
    dto: CreateShiftTemplateDto | UpdateShiftTemplateDto,
  ): void {
    const type = dto.type;

    if (!type) {
      return; // Type might not be provided in update, skip validation
    }

    // Validate flexible hours shift
    if (type === 'flexible') {
      if ('flexibleStartWindow' in dto && !dto.flexibleStartWindow) {
        throw new BadRequestException(
          'flexibleStartWindow is required for flexible shift type',
        );
      }
      if ('flexibleEndWindow' in dto && !dto.flexibleEndWindow) {
        throw new BadRequestException(
          'flexibleEndWindow is required for flexible shift type',
        );
      }
      if (
        'requiredHours' in dto &&
        (!dto.requiredHours || dto.requiredHours < 1 || dto.requiredHours > 24)
      ) {
        throw new BadRequestException(
          'requiredHours must be between 1 and 24 for flexible shift type',
        );
      }

      // Validate time window format and logic
      if (dto.flexibleStartWindow && dto.flexibleEndWindow) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (
          !timeRegex.test(dto.flexibleStartWindow) ||
          !timeRegex.test(dto.flexibleEndWindow)
        ) {
          throw new BadRequestException(
            'Time format must be HH:mm (24-hour format)',
          );
        }

        const [startHour, startMin] = dto.flexibleStartWindow
          .split(':')
          .map(Number);
        const [endHour, endMin] = dto.flexibleEndWindow.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          throw new BadRequestException(
            'flexibleStartWindow must be before flexibleEndWindow',
          );
        }

        const windowHours = (endMinutes - startMinutes) / 60;
        if (dto.requiredHours && dto.requiredHours > windowHours) {
          throw new BadRequestException(
            'requiredHours cannot exceed the time window between flexibleStartWindow and flexibleEndWindow',
          );
        }
      }
    }

    // Validate compressed workweek shift
    if (type === 'compressed') {
      if (
        'workDaysPerWeek' in dto &&
        (!dto.workDaysPerWeek ||
          dto.workDaysPerWeek < 1 ||
          dto.workDaysPerWeek > 7)
      ) {
        throw new BadRequestException(
          'workDaysPerWeek must be between 1 and 7 for compressed shift type',
        );
      }
      if (
        'hoursPerDay' in dto &&
        (!dto.hoursPerDay || dto.hoursPerDay < 1 || dto.hoursPerDay > 24)
      ) {
        throw new BadRequestException(
          'hoursPerDay must be between 1 and 24 for compressed shift type',
        );
      }

      // Validate total weekly hours (should be reasonable, e.g., 35-50 hours)
      if (dto.workDaysPerWeek && dto.hoursPerDay) {
        const totalWeeklyHours = dto.workDaysPerWeek * dto.hoursPerDay;
        if (totalWeeklyHours < 20 || totalWeeklyHours > 60) {
          throw new BadRequestException(
            `Total weekly hours (${totalWeeklyHours}) should be between 20 and 60 for compressed workweek`,
          );
        }
      }
    }

    // Validate standard shift types (normal, split, overnight, rotational)
    if (['normal', 'split', 'overnight', 'rotational'].includes(type)) {
      if ('startTime' in dto && !dto.startTime) {
        throw new BadRequestException(
          `startTime is required for ${type} shift type`,
        );
      }
      if ('endTime' in dto && !dto.endTime) {
        throw new BadRequestException(
          `endTime is required for ${type} shift type`,
        );
      }

      // Validate time format
      if (dto.startTime && dto.endTime) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(dto.startTime) || !timeRegex.test(dto.endTime)) {
          throw new BadRequestException(
            'Time format must be HH:mm (24-hour format)',
          );
        }
      }
    }
  }

  /**
   * Create a new shift template
   */
  async create(
    createDto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplateDocument> {
    this.validateShiftTemplate(createDto);
    const shiftTemplate = new this.shiftTemplateModel(createDto);
    return shiftTemplate.save();
  }

  /**
   * Get all shift templates
   */
  async findAll(): Promise<ShiftTemplateDocument[]> {
    try {
      console.log(
        '[ShiftTemplateService] findAll() - Querying all shift templates...',
      );
      console.log(
        '[ShiftTemplateService] Model collection name:',
        this.shiftTemplateModel.collection.name,
      );
      console.log(
        '[ShiftTemplateService] Model db name:',
        this.shiftTemplateModel.db?.name || 'unknown',
      );

      // Get the actual database being used
      const db = this.shiftTemplateModel.db;
      if (db) {
        // Get connection info
        const client = (db as any).client;
        if (client) {
          console.log(
            '[ShiftTemplateService] MongoDB connection host:',
            client.options?.hosts || 'unknown',
          );
        }

        // Get database name
        const dbName =
          (db as any).databaseName ||
          (db as any).s?.namespace?.split('.')[0] ||
          'unknown';
        console.log('[ShiftTemplateService] Actual database name:', dbName);
      }

      // List all databases to verify connection and check for documents in other databases
      try {
        if (db) {
          const client = (db as any).client;
          if (client) {
            const adminDb = client.db().admin();
            const dbList = await adminDb.listDatabases();
            console.log(
              '[ShiftTemplateService] Available databases:',
              dbList.databases.map(
                (d: any) =>
                  `${d.name} (${(d.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`,
              ),
            );

            // Check other databases for shift templates (they might be in a different database)
            const otherDatabases = [
              'time_management',
              'timemanagement',
              'timemanagement_dev',
            ];
            console.log(
              '[ShiftTemplateService] Checking other databases for shift templates...',
            );
            for (const dbName of otherDatabases) {
              try {
                const otherDb = client.db(dbName);
                const count = await otherDb
                  .collection('shifttemplates')
                  .countDocuments({});
                if (count > 0) {
                  console.log(
                    `[ShiftTemplateService] ⚠️ FOUND ${count} documents in database "${dbName}" collection "shifttemplates"!`,
                  );
                  const docs = await otherDb
                    .collection('shifttemplates')
                    .find({})
                    .limit(6)
                    .toArray();
                  console.log(
                    `[ShiftTemplateService] Document names in "${dbName}":`,
                    docs.map((d: any) => d.name || 'NO NAME'),
                  );
                  console.log(
                    `[ShiftTemplateService] Document IDs in "${dbName}":`,
                    docs.map((d: any) => d._id),
                  );
                } else {
                  console.log(
                    `[ShiftTemplateService] Database "${dbName}" has 0 documents in "shifttemplates"`,
                  );
                }
              } catch (e: any) {
                console.log(
                  `[ShiftTemplateService] Could not check database "${dbName}":`,
                  e?.message || e,
                );
              }
            }
          }
        }
      } catch (e: any) {
        console.log(
          '[ShiftTemplateService] Could not list databases:',
          e?.message || e,
        );
      }

      // List all collections in current database using a simpler approach
      try {
        if (db) {
          // Use the native MongoDB driver method - listCollections returns a cursor
          const collectionsCursor: any = db.listCollections();
          if (
            collectionsCursor &&
            typeof collectionsCursor.toArray === 'function'
          ) {
            const collections = await collectionsCursor.toArray();
            console.log(
              '[ShiftTemplateService] Collections in database:',
              collections?.map((c: any) => c.name) || [],
            );

            // Count documents in each collection
            for (const coll of collections || []) {
              const count = await db.collection(coll.name).countDocuments({});
              console.log(
                `[ShiftTemplateService] Collection "${coll.name}": ${count} documents`,
              );
            }
          } else {
            // Fallback: try to get collections another way
            console.log(
              '[ShiftTemplateService] listCollections() returned unexpected type, trying alternative method',
            );
          }
        }
      } catch (e: any) {
        console.log(
          '[ShiftTemplateService] Could not list collections:',
          e?.message || e,
        );
      }

      // Try to get count first
      const count = await this.shiftTemplateModel.countDocuments().exec();
      console.log(
        `[ShiftTemplateService] Total documents in collection: ${count}`,
      );

      // Try raw MongoDB query to verify (bypasses Mongoose schema validation)
      const rawCount = await this.shiftTemplateModel.collection.countDocuments(
        {},
      );
      console.log(`[ShiftTemplateService] Raw MongoDB count: ${rawCount}`);

      // Get all raw documents without schema validation
      const rawDocuments = await this.shiftTemplateModel.collection
        .find({})
        .toArray();
      console.log(
        `[ShiftTemplateService] Raw documents found: ${rawDocuments.length}`,
      );
      if (rawDocuments.length > 0) {
        console.log(
          '[ShiftTemplateService] Raw document _ids:',
          rawDocuments.map((d) => d._id),
        );
        console.log(
          '[ShiftTemplateService] Raw document names:',
          rawDocuments.map((d) => d.name || 'NO NAME'),
        );
      }

      // The collection listing above already shows all collections and their counts
      // So we don't need to check again here

      // Try with strict: false to include documents that don't fully match schema
      const templates = await this.shiftTemplateModel.find().lean().exec();
      console.log(
        `[ShiftTemplateService] findAll() - Found ${templates?.length || 0} templates (with lean)`,
      );

      // Also try without lean() to see if there's a difference
      const templatesWithMongoose = await this.shiftTemplateModel.find().exec();
      console.log(
        `[ShiftTemplateService] findAll() (with Mongoose) - Found ${templatesWithMongoose?.length || 0} templates`,
      );

      // Try with allowDiskUse and no validation
      const allTemplates = await this.shiftTemplateModel
        .find()
        .lean({ defaults: true })
        .exec();
      console.log(
        `[ShiftTemplateService] findAll() (lean with defaults) - Found ${allTemplates?.length || 0} templates`,
      );

      // If raw count is higher, there are documents that don't match schema
      if (rawCount > templatesWithMongoose.length) {
        console.warn(
          `[ShiftTemplateService] ⚠️ WARNING: ${rawCount - templatesWithMongoose.length} documents are being filtered out by Mongoose schema validation!`,
        );
        console.warn(
          `[ShiftTemplateService] These documents likely don't have required fields (name, type) or have invalid enum values.`,
        );
      }

      if (templates && templates.length > 0) {
        console.log(
          '[ShiftTemplateService] Template names:',
          templates.map((t) => t.name),
        );
        console.log(
          '[ShiftTemplateService] Template IDs:',
          templates.map((t) => t._id),
        );
        console.log(
          '[ShiftTemplateService] Template statuses:',
          templates.map((t) => t.status),
        );
      } else {
        console.warn(
          '[ShiftTemplateService] ⚠️ No templates found! Collection might be empty or query failed.',
        );
      }

      // Return the Mongoose documents (not lean) for proper serialization
      return templatesWithMongoose;
    } catch (error) {
      console.error('[ShiftTemplateService] ❌ Error in findAll():', error);
      throw error;
    }
  }

  /**
   * Get shift template by ID
   */
  async findById(id: string): Promise<ShiftTemplateDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shift template ID');
    }
    const shiftTemplate = await this.shiftTemplateModel.findById(id).exec();
    if (!shiftTemplate) {
      throw new NotFoundException(`Shift template with ID ${id} not found`);
    }
    return shiftTemplate;
  }

  /**
   * Update shift template
   */
  async update(
    id: string,
    updateDto: UpdateShiftTemplateDto,
  ): Promise<ShiftTemplateDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shift template ID');
    }

    // If type is being updated, we need to validate the new type requirements
    // Otherwise, get existing template to validate against current type
    let currentType = updateDto.type;
    if (!currentType) {
      const existing = await this.shiftTemplateModel.findById(id).exec();
      if (existing) {
        currentType = existing.type;
        // Merge existing data with update for validation
        const mergedDto = { ...existing.toObject(), ...updateDto };
        this.validateShiftTemplate(mergedDto as any);
      }
    } else {
      this.validateShiftTemplate(updateDto);
    }

    const shiftTemplate = await this.shiftTemplateModel
      .findByIdAndUpdate(
        id,
        { $set: updateDto },
        { new: true, runValidators: true },
      )
      .exec();
    if (!shiftTemplate) {
      throw new NotFoundException(`Shift template with ID ${id} not found`);
    }
    return shiftTemplate;
  }

  /**
   * Delete shift template
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shift template ID');
    }
    // Check if template is used in any assignments
    const assignments = await this.scheduleAssignmentModel
      .countDocuments({
        shiftTemplateId: new Types.ObjectId(id),
        status: 'Active',
      })
      .exec();
    if (assignments > 0) {
      throw new ConflictException(
        `Cannot delete shift template: ${assignments} active assignments exist`,
      );
    }
    const result = await this.shiftTemplateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Shift template with ID ${id} not found`);
    }
  }
}
