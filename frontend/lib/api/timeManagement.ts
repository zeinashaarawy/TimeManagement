const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/time-management';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = (await res.text()) || res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getAttendance(employeeId: string, date: string) {
  const url = `${API_BASE_URL}/attendance/${encodeURIComponent(employeeId)}?date=${encodeURIComponent(date)}`;
  const res = await fetch(url, { method: 'GET' });
  return handleResponse(res);
}

export async function getExceptions(employeeId: string) {
  const url = `${API_BASE_URL}/exceptions/${encodeURIComponent(employeeId)}`;
  const res = await fetch(url, { method: 'GET' });
  return handleResponse(res);
}

export async function punch(employeeId: string) {
  const res = await fetch(`${API_BASE_URL}/punch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return handleResponse(res);
}

export async function submitException(payload: { attendanceRecordId: string; reason: string; comment?: string }) {
  const res = await fetch(`${API_BASE_URL}/exceptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getPendingExceptions() {
  const res = await fetch(`${API_BASE_URL}/exceptions/pending`, { method: 'GET' });
  return handleResponse(res);
}

export async function approveException(id: string, comment: string) {
  const res = await fetch(`${API_BASE_URL}/exceptions/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
  return handleResponse(res);
}

export async function rejectException(id: string, comment: string) {
  const res = await fetch(`${API_BASE_URL}/exceptions/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
  return handleResponse(res);
}

