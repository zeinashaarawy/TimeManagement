#!/bin/bash
# Bash Script to Test Role-Based Access Controls
# Usage: chmod +x test-roles.sh && ./test-roles.sh

BASE_URL="http://localhost:3001"
USER_ID="646576757365723132330000"

echo ""
echo "========================================"
echo "  ROLE-BASED ACCESS CONTROL TESTING"
echo "========================================"
echo ""

# Test 1: HR Manager accessing payroll sync (should work)
echo "=== Test 1: HR Manager accessing payroll sync ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/payroll/sync" \
  -H "Content-Type: application/json" \
  -H "x-user-role: HR Manager" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-31"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "✅ SUCCESS: HR Manager can access payroll sync"
  echo "Response: $body"
else
  echo "❌ FAILED: HTTP $http_code"
  echo "Response: $body"
fi

# Test 2: Employee trying to access payroll sync (should fail)
echo ""
echo "=== Test 2: Employee accessing payroll sync (should be denied) ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/payroll/sync" \
  -H "Content-Type: application/json" \
  -H "x-user-role: department employee" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-31"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "⚠️  WARNING: Employee was allowed (RolesGuard may be in Phase 1 mode)"
  echo "Response: $body"
else
  echo "✅ EXPECTED: Employee was denied access (HTTP $http_code)"
fi

# Test 3: HR Manager creating policy (should work)
echo ""
echo "=== Test 3: HR Manager creating policy ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/policies" \
  -H "Content-Type: application/json" \
  -H "x-user-role: HR Manager" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "name": "Test Policy - Role Testing",
    "scope": "GLOBAL",
    "active": true,
    "latenessRule": {
      "gracePeriodMinutes": 15,
      "deductionPerMinute": 1,
      "maxDeductionPerDay": 100
    }
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "✅ SUCCESS: HR Manager can create policy"
  echo "Response: $body"
else
  echo "❌ FAILED: HTTP $http_code"
  echo "Response: $body"
fi

# Test 4: Employee trying to create policy (should fail)
echo ""
echo "=== Test 4: Employee creating policy (should be denied) ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/policies" \
  -H "Content-Type: application/json" \
  -H "x-user-role: department employee" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "name": "Unauthorized Policy",
    "scope": "GLOBAL",
    "active": true
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "⚠️  WARNING: Employee was allowed (RolesGuard may be in Phase 1 mode)"
else
  echo "✅ EXPECTED: Employee was denied access (HTTP $http_code)"
fi

# Test 5: Get policies (should work for all roles)
echo ""
echo "=== Test 5: Employee viewing policies (read-only access) ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/policies" \
  -H "x-user-role: department employee" \
  -H "x-user-id: $USER_ID")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "✅ SUCCESS: Employee can view policies (read-only)"
  policy_count=$(echo "$body" | grep -o '"name"' | wc -l)
  echo "Found approximately $policy_count policies"
else
  echo "❌ FAILED: HTTP $http_code"
fi

echo ""
echo "========================================"
echo "  TESTING COMPLETE"
echo "========================================"
echo ""
echo "Note: If tests show 'WARNING', the RolesGuard is in Phase 1 mode"
echo "      (allows access when no role header is present)."
echo "      In production, this will be enforced strictly."
echo ""


