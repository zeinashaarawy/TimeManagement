import axios from "axios";
import { UserRole } from "../utils/auth";

// Base URL - same as timeManagementApi (backend runs on port 5001)
const getBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '5001';
    return `http://${hostname}:${backendPort}`;
  }
  
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
};

const BASE_URL = getBaseURL();

// Auth API instance
const AuthAPI = axios.create({
  baseURL: `${BASE_URL}/auth`,
});

/**
 * Login with employee number and password
 * POST /auth/login
 */
export const login = (data: {
  employeeNumber: string;
  password: string;
}) => AuthAPI.post("/login", data);

/**
 * Register a new employee
 * POST /auth/register
 */
export const register = (data: {
  employeeNumber: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfHire: string;
  address: {
    city: string;
    street: string;
  };
}) => AuthAPI.post("/register", data);

