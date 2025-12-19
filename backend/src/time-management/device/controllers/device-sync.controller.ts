import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { DeviceSyncService } from '../services/device-sync.service';
import { RolesGuard } from '../../Shift/guards/roles.guard';
import { Roles } from '../../Shift/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Time Management - Device Sync')
@Controller('time-management/device')
@UseGuards(RolesGuard)
export class DeviceSyncController {
  constructor(private readonly deviceSyncService: DeviceSyncService) {}

  @Post('sync/:device')
  @Roles('System Admin', 'HR Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync queued punches for a device (BR-TM-13)' })
  @ApiParam({ name: 'device', description: 'Device identifier' })
  @ApiResponse({ status: 200, description: 'Device sync result' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async syncDevice(@Param('device') device: string) {
    return this.deviceSyncService.syncDevicePunches(device);
  }

  @Get('queue/:device')
  @Roles('System Admin', 'HR Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get queue status for a device' })
  @ApiParam({ name: 'device', description: 'Device identifier' })
  @ApiResponse({ status: 200, description: 'Queue status' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getQueueStatus(@Param('device') device: string) {
    return this.deviceSyncService.getQueueStatus(device);
  }

  @Get('devices')
  @Roles('System Admin', 'HR Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all devices with queued punches' })
  @ApiResponse({ status: 200, description: 'List of devices with queued punches' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDevicesWithQueuedPunches() {
    const devices = this.deviceSyncService.getDevicesWithQueuedPunches();
    return { devices };
  }
}

