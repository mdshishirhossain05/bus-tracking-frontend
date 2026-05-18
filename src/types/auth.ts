export type UserRole = "ADMIN" | "DRIVER" | "PASSENGER";
export type UserApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type UserRegistrationSource = "ADMIN" | "SELF";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  isActive?: boolean;
  studentId?: string | null;
  phoneNumber?: string | null;
  approvalStatus?: UserApprovalStatus;
  registrationSource?: UserRegistrationSource;
  createdAt?: string;
}

export interface MeResponseData {
  user: AuthUser;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthSessionItem {
  id: string;
  deviceLabel: string | null;
  userAgentRaw: string | null;
  createdAt: string;
  lastSeenAt: string;
  ipFirst: string | null;
  ipLast: string | null;
  lastSeenIp: string | null;
  refreshFamilyId: string;
  current: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
}
