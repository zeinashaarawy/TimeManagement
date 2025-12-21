# Shift Assignment 400 Bad Request Error - Fix Guide

## Common Causes of 400 Error

### 1. **Missing or Invalid Authentication Headers**
**Problem**: Backend requires `x-user-id` header for assignment creation.

**Fix Applied**: ✅ Added authentication headers to `TimeManagementAPI` interceptor:
- `x-user-id`: From `localStorage.getItem('userId')`
- `x-user-role`: From `localStorage.getItem('userRole')` (normalized to uppercase with underscores)
- `Authorization`: Bearer token if available

### 2. **Invalid Date Format**
**Problem**: Backend expects ISO 8601 date strings, but HTML date inputs return "YYYY-MM-DD".

**Fix Applied**: ✅ Convert dates to ISO format:
```typescript
effectiveFrom: new Date(formData.effectiveFrom).toISOString(),
effectiveTo: new Date(formData.effectiveTo).toISOString(),
```

### 3. **Invalid MongoDB ObjectId Format**
**Problem**: Backend validates that all IDs are valid 24-character hexadecimal ObjectIds.

**Requirements**:
- Must be exactly 24 characters
- Must contain only hexadecimal characters (0-9, a-f, A-F)
- Example: `507f1f77bcf86cd799439011`

**Fix Applied**: ✅ Added client-side validation and trimming:
```typescript
assignmentData.shiftTemplateId = formData.shiftTemplateId.trim();
assignmentData.employeeId = formData.employeeId.trim();
```

### 4. **Missing Required Fields**
**Problem**: Backend requires exactly one of: `employeeId`, `departmentId`, or `positionId`.

**Fix Applied**: ✅ Added validation before submission:
- Validates shiftTemplateId is selected
- Validates dates are provided
- Validates exactly one target (employee/department/position) is selected
- Validates date range (effectiveFrom < effectiveTo)

### 5. **Reason Field Location**
**Problem**: Backend expects `reason` in `metadata.reason`, not at root level.

**Fix Applied**: ✅ Moved reason to metadata:
```typescript
if (formData.reason) {
  assignmentData.metadata = {
    reason: formData.reason,
  };
}
```

## How to Debug 400 Errors

1. **Check Browser Console**: Look for the error response details
2. **Check Network Tab**: Inspect the request payload and response
3. **Check Backend Logs**: Backend logs detailed error messages

## Expected Request Format

```json
{
  "shiftTemplateId": "507f1f77bcf86cd799439011",
  "employeeId": "507f1f77bcf86cd799439012",  // OR departmentId OR positionId
  "effectiveFrom": "2025-01-01T00:00:00.000Z",
  "effectiveTo": "2025-12-31T23:59:59.999Z",
  "metadata": {
    "reason": "New shift assignment"
  }
}
```

## Headers Required

```
x-user-id: 507f1f77bcf86cd799439015
x-user-role: HR_ADMIN
Authorization: Bearer <token> (optional)
```

## Testing Checklist

- [ ] User ID is set in localStorage (`localStorage.getItem('userId')`)
- [ ] User role is set in localStorage (`localStorage.getItem('userRole')`)
- [ ] Shift template ID is a valid 24-char ObjectId
- [ ] Employee/Department/Position ID is a valid 24-char ObjectId
- [ ] Dates are in valid format (YYYY-MM-DD from input, converted to ISO)
- [ ] Effective From < Effective To
- [ ] Exactly one target is selected (not zero, not multiple)

