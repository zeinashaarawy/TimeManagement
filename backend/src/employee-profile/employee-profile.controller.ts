import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  Query,
  ForbiddenException,

} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import {
  EMPLOYEE_ROLES,
  MANAGER_ROLES,
  HR_ROLES,
  ADMIN_ROLES,
} from '../common/constants/role-groups';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SystemRole, SystemRole as RoleEnum } from './enums/employee-profile.enums';
import { Request } from 'express';
import { EmployeeProfileService } from './employee-profile.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SelfUpdateDto } from './dto/self-update.dto';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';

import { UnauthorizedException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';


@Controller('employee-profile')

export class EmployeeProfileController {
  constructor(
    private readonly employeeProfileService: EmployeeProfileService,
  ) {}

  // CREATE (HR/Admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...MANAGER_ROLES ,...ADMIN_ROLES)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeProfileService.create(dto);
  }

  // GET ALL
 @Get()
 @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...MANAGER_ROLES, ...ADMIN_ROLES)
findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10
) {
  return this.employeeProfileService.findAll(Number(page), Number(limit));
}
  
 @Post('set-password/:id')
 @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
setPassword(
  @Param('id') id: string,
  @Body() dto: { password: string }
) {
  return this.employeeProfileService.setPassword(id, dto.password);
}

  // EMPLOYEE SELF-SERVICE UPDATE
@Patch('self-update')
@UseGuards(JwtAuthGuard, RolesGuard)
 @Roles(...EMPLOYEE_ROLES)
selfUpdate(@Req() req: any, @Body() dto: SelfUpdateDto) {
  const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Not authenticated ❌');
  return this.employeeProfileService.selfUpdate(userId, dto);
}
// Employee submits a change request
@Post('change-requests')
@UseGuards(JwtAuthGuard, RolesGuard)  // make sure JWT decoded first ✅
@Roles(...EMPLOYEE_ROLES)
createChangeRequest( @Body() dto: CreateChangeRequestDto, @Req() req: any) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException("Not authenticated ❌");
  return this.employeeProfileService.createChangeRequest(userId, dto); // ✅ 2 args provided
}


// Employee views all their change requests
// Employee views all their change requests
@Get('change-requests/by-employee/:employeeProfileId')
@UseGuards( JwtAuthGuard, RolesGuard)
@Roles(...EMPLOYEE_ROLES)
getEmployeeChangeRequests( @Param('employeeProfileId') employeeProfileId: string) {
  // Optional extra check to prevent employee from entering another ID in URL:
  
  return this.employeeProfileService.getEmployeeChangeRequests(employeeProfileId);
}

// HR approves request
@Patch('change-requests/:id/approve')
@UseGuards(JwtAuthGuard, RolesGuard)      // ✅ enforce authentication + authorization
@Roles(...HR_ROLES, ...ADMIN_ROLES)
approveChangeRequest(@Param('id') id: string) {
  return this.employeeProfileService.approveChangeRequest(id);
}

// HR rejects request
@Patch('change-requests/:id/reject')
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  rejectChangeRequest(@Param('id') id: string, @Body('reason') reason: string) {
    return this.employeeProfileService.rejectChangeRequest(id, reason);
  }

// MANAGER: View team summary
@Get('manager/team/:managerId')
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  getTeamSummary(@Param('managerId') managerId: string) {
  return this.employeeProfileService.getTeamSummaryForManager(managerId);
}
// MANAGER assigns an employee to themselves (existing managerId field)



// MANAGER: View one employee from team
@Get('manager/team/:managerId/employee/:employeeId')
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGER_ROLES)
  getTeamEmployee(
  @Param('managerId') managerId: string,
  @Param('employeeId') employeeId: string
) {
  return this.employeeProfileService.getTeamEmployeeSummary(managerId, employeeId);
}

// HR audit: view all
  @Get('change-requests/all')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getAllRequests() {
    return this.employeeProfileService.getAllChangeRequests();
  }

  // Find by UUID
  @Get('change-requests/request/:requestId')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getByUUID(@Param('requestId') requestId: string) {
    return this.employeeProfileService.findChangeRequestByUUID(requestId);
  }

@Patch('change-requests/:id/withdraw')
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
withdrawChangeRequest(@Req() req: any,@Param('id') id: string) {
  if (req.user?.role !== RoleEnum.DEPARTMENT_EMPLOYEE) {
      throw new ForbiddenException('You do not have permission ❌');
    }
  return this.employeeProfileService.withdrawChangeRequest(id);
}
    // GET ONE BY ID
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  findOne(@Param('id') id: string) {
    return this.employeeProfileService.findOne(id);
  }

  

  // UPDATE (HR/Admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeProfileService.update(id, dto);
  }


  // DELETE / DEACTIVATE (optional)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles( ...ADMIN_ROLES)
  remove(@Param('id') id: string) {
    return this.employeeProfileService.deactivate(id);
  }

@Get('profile/me')
  @UseGuards(JwtAuthGuard, RolesGuard)  // ✅ decodes JWT and attaches req.user
  @Roles(...EMPLOYEE_ROLES , ...MANAGER_ROLES, ...HR_ROLES, ...ADMIN_ROLES) // ✅ allow all roles to access their profile
  getMyProfile(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException("Not authenticated ❌");
    return this.employeeProfileService.getMyProfile(userId);
  }
  
@Patch('change-requests/:id/approve-dispute')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...ADMIN_ROLES)
approveDispute(
  @Param('id') id: string,
  @Body('resolution') resolution: string
) {
  return this.employeeProfileService.approveDispute(id, resolution);
}


  @Post('change-requests/:id/dispute')
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...EMPLOYEE_ROLES)        // ✅ employee role from your constants

submitDispute(
  @Req() req: any,
  @Param('id') originalRequestId: string,
  @Body() body: { employeeProfileId: string; dispute: string }
) {

  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException("Not authenticated ❌");

  return this.employeeProfileService.submitDispute({
    employeeProfileId: body.employeeProfileId,
    originalRequestId,
    dispute: body.dispute,
  });
}

// HR resolves a dispute
@Patch('change-requests/:id/resolve-dispute')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES, ...ADMIN_ROLES)
resolveDispute(
  @Param('id') id: string,
  @Body('resolution') resolution: string
) {
  return this.employeeProfileService.resolveDispute(id, resolution);

  
}

}



