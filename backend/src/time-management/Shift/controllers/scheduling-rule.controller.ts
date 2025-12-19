import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SchedulingRuleService } from '../services/scheduling-rule.service';
import { CreateSchedulingRuleDto } from '../dto/create-scheduling-rule.dto';
import { UpdateSchedulingRuleDto } from '../dto/update-scheduling-rule.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('scheduling-rules')
@Controller('time-management/scheduling-rules')
@UseGuards(RolesGuard)
export class SchedulingRuleController {
  constructor(private readonly schedulingRuleService: SchedulingRuleService) {}

  @Post()
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'System Admin', 'HR Admin')
  @ApiOperation({ summary: 'Create a new scheduling rule' })
  @ApiResponse({
    status: 201,
    description: 'Scheduling rule created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createDto: CreateSchedulingRuleDto) {
    return this.schedulingRuleService.create(createDto);
  }

  @Get()
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'System Admin', 'HR Admin')
  @ApiOperation({ summary: 'Get all scheduling rules' })
  @ApiResponse({ status: 200, description: 'List of scheduling rules' })
  async findAll() {
    return this.schedulingRuleService.findAll();
  }

  @Get(':id')
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'System Admin', 'HR Admin')
  @ApiOperation({ summary: 'Get scheduling rule by ID' })
  @ApiResponse({ status: 200, description: 'Scheduling rule found' })
  @ApiResponse({ status: 404, description: 'Scheduling rule not found' })
  async findOne(@Param('id') id: string) {
    return this.schedulingRuleService.findOne(id);
  }

  @Patch(':id')
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'System Admin', 'HR Admin')
  @ApiOperation({ summary: 'Update scheduling rule' })
  @ApiResponse({ status: 200, description: 'Scheduling rule updated' })
  @ApiResponse({ status: 404, description: 'Scheduling rule not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSchedulingRuleDto,
  ) {
    return this.schedulingRuleService.update(id, updateDto);
  }

  @Patch(':id/toggle-active')
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'System Admin', 'HR Admin')
  @ApiOperation({ summary: 'Toggle scheduling rule active status' })
  @ApiResponse({ status: 200, description: 'Scheduling rule status toggled' })
  @ApiResponse({ status: 404, description: 'Scheduling rule not found' })
  async toggleActive(@Param('id') id: string) {
    return this.schedulingRuleService.toggleActive(id);
  }

  @Delete(':id')
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'System Admin', 'HR Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete scheduling rule' })
  @ApiResponse({ status: 204, description: 'Scheduling rule deleted' })
  @ApiResponse({ status: 404, description: 'Scheduling rule not found' })
  async delete(@Param('id') id: string) {
    await this.schedulingRuleService.delete(id);
  }
}
