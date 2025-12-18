import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';

@Controller('auth')
export class EmployeeProfileController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  login(@Body() dto: { employeeNumber: string; password: string }) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
