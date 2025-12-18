import { SystemRole } from '../enums/employee-profile.enums';

export class RegisterDto {
  employeeNumber: string;
  password: string;
  role: SystemRole;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfHire: string;
  address: { city: string; street: string } // ✅ must be object not string
}