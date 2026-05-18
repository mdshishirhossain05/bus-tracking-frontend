"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approvePassenger as approvePassengerRequest,
  createAdminUser,
  deleteUser as deleteUserRequest,
  getAdminUsers,
  getRegistrationSettings,
  rejectPassenger as rejectPassengerRequest,
  updateAdminUser,
  updateRegistrationSettings as updateRegistrationSettingsRequest,
  updateUserRole,
  updateUserStatus,
  type AdminUserItem,
  type RegistrationSettings,
  type UserApprovalStatus,
  type UserRegistrationSource,
  type UserRole,
} from "../api/admin.users.api";

interface UserQueryState {
  page: number;
  limit: number;
  search: string;
  role: UserRole | "ALL";
  isActive: "ALL" | "true" | "false";
  approvalStatus: UserApprovalStatus | "ALL";
  registrationSource: UserRegistrationSource | "ALL";
  academicDepartment: string;
  academicBatch: string;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registrationSettings, setRegistrationSettings] =
    useState<RegistrationSettings | null>(null);
  const [registrationSettingsLoading, setRegistrationSettingsLoading] =
    useState(true);
  const [registrationSettingsSaving, setRegistrationSettingsSaving] =
    useState(false);

  const [query, setQuery] = useState<UserQueryState>({
    page: 1,
    limit: 20,
    search: "",
    role: "ALL",
    isActive: "ALL",
    approvalStatus: "ALL",
    registrationSource: "ALL",
    academicDepartment: "",
    academicBatch: "",
  });

  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const buildRequestParams = useCallback((currentQuery: UserQueryState) => {
    return {
      page: currentQuery.page,
      limit: currentQuery.limit,
      search: currentQuery.search.trim() || undefined,
      role: currentQuery.role === "ALL" ? undefined : currentQuery.role,
      isActive:
        currentQuery.isActive === "ALL"
          ? undefined
          : currentQuery.isActive === "true",
      approvalStatus:
        currentQuery.approvalStatus === "ALL"
          ? undefined
          : currentQuery.approvalStatus,
      registrationSource:
        currentQuery.registrationSource === "ALL"
          ? undefined
          : currentQuery.registrationSource,
      academicDepartment: currentQuery.academicDepartment.trim() || undefined,
      academicBatch: currentQuery.academicBatch.trim() || undefined,
    };
  }, []);

  const fetchUsers = useCallback(
    async (currentQuery: UserQueryState) => {
      setLoading(true);
      setError(null);

      try {
        const res = await getAdminUsers(buildRequestParams(currentQuery));

        setUsers(Array.isArray(res.items) ? res.items : []);
        setMeta({
          page: Number(res.meta?.page ?? currentQuery.page),
          limit: Number(res.meta?.limit ?? currentQuery.limit),
          total: Number(res.meta?.total ?? 0),
          totalPages: Number(res.meta?.totalPages ?? 1),
        });

        return res;
      } catch (err) {
        setError("Failed to load users.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildRequestParams],
  );

  const fetchRegistrationSettings = useCallback(async () => {
    setRegistrationSettingsLoading(true);

    try {
      const config = await getRegistrationSettings();
      setRegistrationSettings(config);
      return config;
    } finally {
      setRegistrationSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers(query).catch(() => {});
  }, [fetchUsers, query]);

  useEffect(() => {
    void fetchRegistrationSettings().catch(() => {});
  }, [fetchRegistrationSettings]);

  const reload = useCallback(
    async () => fetchUsers(query),
    [fetchUsers, query],
  );

  const approvePassenger = useCallback(
    async (id: string, note?: string) => {
      const updated = await approvePassengerRequest(id, note);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? {
                ...user,
                ...updated,
                approvalStatus: "APPROVED",
                isActive: true,
              }
            : user,
        ),
      );

      await fetchUsers(query);
      return updated;
    },
    [fetchUsers, query],
  );

  const rejectPassenger = useCallback(
    async (id: string, reason: string) => {
      const updated = await rejectPassengerRequest(id, reason);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? {
                ...user,
                ...updated,
                approvalStatus: "REJECTED",
                isActive: false,
              }
            : user,
        ),
      );

      await fetchUsers(query);
      return updated;
    },
    [fetchUsers, query],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const result = await deleteUserRequest(id);

      setUsers((prev) => prev.filter((user) => user.id !== id));
      setMeta((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      await fetchUsers(query);
      return result;
    },
    [fetchUsers, query],
  );

  const updateRegistrationSettings = useCallback(
    async (enabled: boolean) => {
      const previous = registrationSettings;

      if (registrationSettingsSaving) {
        return previous;
      }

      if (previous?.passengerSelfRegistrationEnabled === enabled) {
        return previous;
      }

      setRegistrationSettingsSaving(true);

      setRegistrationSettings((current) => ({
        passengerSelfRegistrationEnabled: enabled,
        updatedAt: current?.updatedAt,
      }));

      try {
        const updated = await updateRegistrationSettingsRequest({
          passengerSelfRegistrationEnabled: enabled,
        });

        setRegistrationSettings(updated);
        return updated;
      } catch (err) {
        setRegistrationSettings(previous);
        throw err;
      } finally {
        setRegistrationSettingsSaving(false);
      }
    },
    [registrationSettings, registrationSettingsSaving],
  );

  return {
    users,
    loading,
    error,
    meta,
    query,
    registrationSettings,
    registrationSettingsLoading,
    registrationSettingsSaving,
    reload,
    setPage: (page: number) =>
      setQuery((prev) => ({
        ...prev,
        page,
      })),
    setLimit: (limit: number) =>
      setQuery((prev) => ({
        ...prev,
        limit,
        page: 1,
      })),
    setSearch: (search: string) =>
      setQuery((prev) => ({
        ...prev,
        search,
        page: 1,
      })),
    setRole: (role: UserRole | "ALL") =>
      setQuery((prev) => ({
        ...prev,
        role,
        page: 1,
      })),
    setIsActive: (isActive: "ALL" | "true" | "false") =>
      setQuery((prev) => ({
        ...prev,
        isActive,
        page: 1,
      })),
    setApprovalStatus: (approvalStatus: UserApprovalStatus | "ALL") =>
      setQuery((prev) => ({
        ...prev,
        approvalStatus,
        page: 1,
      })),
    setRegistrationSource: (
      registrationSource: UserRegistrationSource | "ALL",
    ) =>
      setQuery((prev) => ({
        ...prev,
        registrationSource,
        page: 1,
      })),
    setAcademicDepartment: (academicDepartment: string) =>
      setQuery((prev) => ({
        ...prev,
        academicDepartment,
        page: 1,
      })),
    setAcademicBatch: (academicBatch: string) =>
      setQuery((prev) => ({
        ...prev,
        academicBatch,
        page: 1,
      })),
    create: createAdminUser,
    update: updateAdminUser,
    updateRole: updateUserRole,
    updateStatus: updateUserStatus,
    approvePassenger,
    rejectPassenger,
    deleteUser,
    updateRegistrationSettings,
  };
}
