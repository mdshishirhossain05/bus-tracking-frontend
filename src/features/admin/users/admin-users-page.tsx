"use client";

import { useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error";
import { useToast } from "@/providers/toast-provider";
import type {
  AdminUserItem,
  UserApprovalStatus,
  UserRegistrationSource,
  UserRole,
} from "./api/admin.users.api";
import { UsersTable } from "./components/users-table";
import { UserFormModal } from "./components/user-form-modal";
import { UserRoleModal } from "./components/user-role-modal";
import { UserSessionDashboardModal } from "./components/user-session-dashboard-modal";
import { UserStatusModal } from "./components/user-status-modal";
import { useAdminUsers } from "./hooks/use-admin-users";

type ModalState =
  | { type: "create" }
  | { type: "edit"; user: AdminUserItem }
  | { type: "role"; user: AdminUserItem }
  | { type: "status"; user: AdminUserItem }
  | { type: "sessions"; user: AdminUserItem }
  | null;

export function AdminUsersPage() {
  const toast = useToast();
  const {
    users,
    loading,
    error,
    meta,
    query,
    reload,
    setPage,
    setLimit,
    setSearch,
    setRole,
    setIsActive,
    setApprovalStatus,
    setRegistrationSource,
    setAcademicDepartment,
    setAcademicBatch,
    create,
    update,
    updateRole,
    updateStatus,
    approvePassenger,
    rejectPassenger,
    deleteUser,
    registrationSettings,
    registrationSettingsLoading,
    registrationSettingsSaving,
    updateRegistrationSettings,
  } = useAdminUsers();

  const [modal, setModal] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(query.search);
  const [departmentInput, setDepartmentInput] = useState(
    query.academicDepartment,
  );
  const [batchInput, setBatchInput] = useState(query.academicBatch);
  const [rejectingUser, setRejectingUser] = useState<AdminUserItem | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);

  const registrationSelectValue = registrationSettings
    ? registrationSettings.passengerSelfRegistrationEnabled
      ? "enabled"
      : "disabled"
    : "";

  async function handleReload() {
    await reload();
  }

  async function handleCreate(values: {
    fullName: string;
    email: string;
    password?: string;
    role?: "ADMIN" | "DRIVER" | "PASSENGER";
    isActive?: boolean;
    studentId?: string;
    phoneNumber?: string;
    academicDepartment?: string;
    academicBatch?: string;
    transportPickupPoint?: string;
  }) {
    try {
      setSubmitting(true);
      setModalError(null);

      await create({
        fullName: values.fullName,
        email: values.email,
        password: values.password!,
        role: values.role!,
        isActive: values.isActive,
        studentId: values.studentId,
        phoneNumber: values.phoneNumber,
        academicDepartment: values.academicDepartment,
        academicBatch: values.academicBatch,
        transportPickupPoint: values.transportPickupPoint,
      });

      toast.success(
        "User created",
        "The account has been created successfully.",
      );
      setModal(null);
      await handleReload();
    } catch (e) {
      const message = getApiErrorMessage(e);
      setModalError(message);
      toast.danger("Create failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(values: {
    fullName: string;
    email: string;
    studentId?: string;
    phoneNumber?: string;
  }) {
    if (!modal || modal.type !== "edit") return;

    try {
      setSubmitting(true);
      setModalError(null);

      await update(modal.user.id, {
        fullName: values.fullName,
        email: values.email,
        studentId: values.studentId ?? null,
        phoneNumber: values.phoneNumber ?? null,
      });

      toast.success("User updated", "User profile has been updated.");
      setModal(null);
      await handleReload();
    } catch (e) {
      const message = getApiErrorMessage(e);
      setModalError(message);
      toast.danger("Update failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleUpdate(role: UserRole) {
    if (!modal || modal.type !== "role") return;

    try {
      setSubmitting(true);
      setModalError(null);

      await updateRole(modal.user.id, role);

      toast.success("Role updated", `${modal.user.fullName} is now ${role}.`);
      setModal(null);
      await handleReload();
    } catch (e) {
      const message = getApiErrorMessage(e);
      setModalError(message);
      toast.danger("Role update failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(isActive: boolean) {
    if (!modal || modal.type !== "status") return;

    try {
      setSubmitting(true);
      setModalError(null);

      await updateStatus(modal.user.id, isActive);

      toast.success(
        "Status updated",
        `${modal.user.fullName} is now ${isActive ? "active" : "inactive"}.`,
      );
      setModal(null);
      await handleReload();
    } catch (e) {
      const message = getApiErrorMessage(e);
      setModalError(message);
      toast.danger("Status update failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprovePassenger(user: AdminUserItem) {
    try {
      await approvePassenger(user.id);
      toast.success(
        "Passenger approved",
        `${user.fullName} can now use the system.`,
      );
    } catch (e) {
      toast.danger("Approval failed", getApiErrorMessage(e));
    }
  }

  async function handleRejectPassenger() {
    if (!rejectingUser) return;

    try {
      setSubmitting(true);
      await rejectPassenger(rejectingUser.id, rejectReason.trim());
      toast.success(
        "Passenger rejected",
        `${rejectingUser.fullName} has been rejected.`,
      );
      setRejectingUser(null);
      setRejectReason("");
    } catch (e) {
      toast.danger("Reject failed", getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;

    try {
      setSubmitting(true);
      await deleteUser(deletingUser.id);
      toast.success(
        "User deleted",
        `${deletingUser.fullName} has been deleted.`,
      );
      setDeletingUser(null);
    } catch (e) {
      toast.danger("Delete failed", getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegistrationToggle(value: string) {
    if (value !== "enabled" && value !== "disabled") return;

    const enabled = value === "enabled";

    if (registrationSettingsSaving) {
      toast.danger(
        "Please wait",
        "Registration policy is still saving. Try again in a moment.",
      );
      return;
    }

    if (registrationSettings?.passengerSelfRegistrationEnabled === enabled) {
      return;
    }

    try {
      await updateRegistrationSettings(enabled);

      toast.success(
        "Registration setting updated",
        enabled
          ? "Passenger self-registration is now enabled."
          : "Passenger self-registration is now disabled.",
      );
    } catch (e) {
      toast.danger("Update failed", getApiErrorMessage(e));
    }
  }

  function closeModal() {
    setModal(null);
    setModalError(null);
    setSubmitting(false);
  }

  function applySearch() {
    setSearch(searchInput);
    setAcademicDepartment(departmentInput);
    setAcademicBatch(batchInput);
  }

  if (loading && users.length === 0) {
    return <SectionSkeleton />;
  }

  if (error && users.length === 0) {
    return (
      <ErrorState
        description="Users could not be loaded from the server."
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="All users"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => void handleReload()}
            >
              Refresh
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => setModal({ type: "create" })}
            >
              Create User
            </Button>
          </div>
        }
      >
        <Card className="border-slate-800 bg-slate-950/70">
          <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-100">
                Passenger onboarding policy
              </p>
              <p className="text-sm text-slate-400">
                Admins can create users directly. Passengers can also
                self-register and will appear here as pending until approved.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge tone="info">
                  Admin-created accounts are active right away
                </Badge>
                <Badge tone="warning">
                  Self-registered passengers need approval
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Passenger self-registration
              </label>

              <Select
                value={registrationSelectValue}
                onChange={(e) => void handleRegistrationToggle(e.target.value)}
                disabled={registrationSettingsLoading}
              >
                {registrationSelectValue === "" ? (
                  <option value="">Loading settings...</option>
                ) : null}
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </Select>

              <p className="text-xs text-slate-500">
                {registrationSettingsSaving
                  ? "Saving registration policy..."
                  : "When disabled, the public passenger registration page and API will be blocked."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Total users</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {meta.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Current page</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {meta.page}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Page size</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {meta.limit}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Total pages</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {meta.totalPages}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_160px_150px_150px_150px_130px_auto]">
          <Input
            placeholder="Search by name, email, or student ID"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />

          <Input
            placeholder="Department"
            value={departmentInput}
            onChange={(e) => setDepartmentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />

          <Input
            placeholder="Batch"
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />

          <Select
            value={query.role}
            onChange={(e) => setRole(e.target.value as UserRole | "ALL")}
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DRIVER">DRIVER</option>
            <option value="PASSENGER">PASSENGER</option>
          </Select>

          <Select
            value={query.isActive}
            onChange={(e) =>
              setIsActive(e.target.value as "ALL" | "true" | "false")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>

          <Select
            value={query.approvalStatus}
            onChange={(e) =>
              setApprovalStatus(e.target.value as UserApprovalStatus | "ALL")
            }
          >
            <option value="ALL">All approvals</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </Select>

          <Select
            value={query.registrationSource}
            onChange={(e) =>
              setRegistrationSource(
                e.target.value as UserRegistrationSource | "ALL",
              )
            }
          >
            <option value="ALL">All sources</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SELF">SELF</option>
          </Select>

          <Select
            value={String(query.limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>

          <Button variant="secondary" onClick={applySearch}>
            Apply
          </Button>
        </div>

        {users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No users match the current filters. Adjust filters or create a new user."
            actionLabel="Create User"
            onAction={() => setModal({ type: "create" })}
          />
        ) : (
          <UsersTable
            users={users}
            onEdit={(u) => setModal({ type: "edit", user: u })}
            onSessions={(u) => setModal({ type: "sessions", user: u })}
            onRoleChange={(u) => setModal({ type: "role", user: u })}
            onStatusChange={(u) => setModal({ type: "status", user: u })}
            onApprovePassenger={(u) => void handleApprovePassenger(u)}
            onRejectPassenger={(u) => {
              setRejectingUser(u);
              setRejectReason("");
            }}
            onDeleteUser={(u) => setDeletingUser(u)}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total
            users)
          </p>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              disabled={meta.page <= 1}
              onClick={() => setPage(meta.page - 1)}
            >
              Previous
            </Button>

            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </PageSection>

      {modal?.type === "create" ? (
        <UserFormModal
          mode="create"
          submitting={submitting}
          errorMessage={modalError}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <UserFormModal
          mode="edit"
          initial={modal.user}
          submitting={submitting}
          errorMessage={modalError}
          onSubmit={handleEdit}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "role" ? (
        <UserRoleModal
          user={modal.user}
          submitting={submitting}
          errorMessage={modalError}
          onSubmit={handleRoleUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "status" ? (
        <UserStatusModal
          user={modal.user}
          submitting={submitting}
          errorMessage={modalError}
          onSubmit={handleStatusUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "sessions" ? (
        <UserSessionDashboardModal
          userId={modal.user.id}
          onClose={closeModal}
        />
      ) : null}

      {rejectingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg rounded-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Reject passenger registration
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {rejectingUser.fullName} will remain inactive and unable to
                  log in.
                </p>
              </div>

              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason"
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRejectingUser(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  disabled={submitting || rejectReason.trim().length < 3}
                  onClick={() => void handleRejectPassenger()}
                >
                  {submitting ? "Rejecting..." : "Reject passenger"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {deletingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg rounded-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Delete user
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This permanently deletes{" "}
                  <span className="font-medium">{deletingUser.fullName}</span>.
                  Only safe passenger accounts can be deleted.
                </p>
              </div>

              <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                This action cannot be undone.
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeletingUser(null)}>
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  disabled={submitting}
                  onClick={() => void handleDeleteUser()}
                >
                  {submitting ? "Deleting..." : "Delete user"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
