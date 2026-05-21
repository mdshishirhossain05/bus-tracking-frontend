"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import {
  ACADEMIC_BATCH_PLACEHOLDER,
  ACADEMIC_DEPARTMENTS,
} from "@/lib/constants/academics";
import type { AdminUserItem } from "../api/admin.users.api";

type CreateableRole = "ADMIN" | "DRIVER" | "PASSENGER";

interface UserFormModalProps {
  mode: "create" | "edit";
  initial?: AdminUserItem | null;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: {
    fullName: string;
    email: string;
    password?: string;
    role?: CreateableRole;
    isActive?: boolean;
    studentId?: string;
    phoneNumber?: string;
    academicDepartment?: string;
    academicBatch?: string;
    transportPickupPoint?: string;
  }) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: CreateableRole;
  isActive: boolean;
  studentId: string;
  phoneNumber: string;
  academicDepartment: string;
  academicBatch: string;
  transportPickupPoint: string;
}

function isPassengerRole(value: string | undefined | null) {
  return value === "PASSENGER";
}

export function UserFormModal({
  mode,
  initial,
  submitting = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: UserFormModalProps) {
  const [values, setValues] = useState<FormState>({
    fullName: initial?.fullName ?? "",
    email: initial?.email ?? "",
    password: "",
    role:
      initial?.role === "ADMIN" ||
      initial?.role === "DRIVER" ||
      initial?.role === "PASSENGER"
        ? initial.role
        : "DRIVER",
    isActive: initial?.isActive ?? true,
    studentId: "",
    phoneNumber: "",
    academicDepartment: "",
    academicBatch: "",
    transportPickupPoint: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const title = useMemo(() => {
    if (mode === "create") {
      return "Create User";
    }
    return "Edit User";
  }, [mode]);

  const roleDescription = useMemo(() => {
    if (mode !== "create") {
      return "Update core user profile information.";
    }

    if (values.role === "PASSENGER") {
      return "Create a passenger account directly from admin. Admin-created passenger accounts can be activated immediately.";
    }

    return "Create internal operational accounts for admins and drivers.";
  }, [mode, values.role]);

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    } else if (values.fullName.trim().length < 2) {
      nextErrors.fullName = "Full name must be at least 2 characters.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (mode === "create") {
      if (!values.password.trim()) {
        nextErrors.password = "Password is required.";
      } else if (values.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }
    }

    if (mode === "create" && isPassengerRole(values.role)) {
      if (!values.studentId.trim()) {
        nextErrors.studentId = "Student ID is required for passenger accounts.";
      } else if (values.studentId.trim().length < 3) {
        nextErrors.studentId = "Student ID must be at least 3 characters.";
      }
    }

    if (values.phoneNumber.trim()) {
      const compact = values.phoneNumber.replace(/\s+/g, "");
      if (!/^[+\d\-()]{7,20}$/.test(compact)) {
        nextErrors.phoneNumber = "Enter a valid phone number.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    if (mode === "create") {
      await onSubmit({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        isActive: values.isActive,
        studentId: values.studentId.trim() || undefined,
        phoneNumber: values.phoneNumber.trim() || undefined,
        academicDepartment: isPassengerRole(values.role)
          ? values.academicDepartment.trim() || undefined
          : undefined,
        academicBatch: isPassengerRole(values.role)
          ? values.academicBatch.trim() || undefined
          : undefined,
        transportPickupPoint: isPassengerRole(values.role)
          ? values.transportPickupPoint.trim() || undefined
          : undefined,
      });
      return;
    }

    await onSubmit({
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      studentId: values.studentId.trim() || undefined,
      phoneNumber: values.phoneNumber.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="w-full max-w-2xl rounded-t-3xl sm:rounded-sm">
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <p className="text-sm text-slate-500">{roleDescription}</p>
          </div>

          {errorMessage ? (
            <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Full name
              </label>
              <Input
                placeholder="e.g. Md. Shishir Hossain"
                value={values.fullName}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
              {errors.fullName ? (
                <p className="text-xs text-red-400">{errors.fullName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Email
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={values.email}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              {errors.email ? (
                <p className="text-xs text-red-400">{errors.email}</p>
              ) : null}
            </div>
          </div>

          {mode === "create" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <PasswordInput
                    placeholder="Set an initial password"
                    value={values.password}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                  {errors.password ? (
                    <p className="text-xs text-red-400">{errors.password}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Role
                  </label>
                  <Select
                    value={values.role}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        role: e.target.value as CreateableRole,
                        studentId:
                          e.target.value === "PASSENGER" ? prev.studentId : "",
                      }))
                    }
                  >
                    <option value="DRIVER">DRIVER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PASSENGER">PASSENGER</option>
                  </Select>
                </div>
              </div>

              {isPassengerRole(values.role) ? (
                <div className="rounded-sm border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                  Admin-created passenger accounts can be activated immediately.
                  Public self-registered passenger accounts should remain
                  pending approval until reviewed by admin.
                </div>
              ) : null}

              {isPassengerRole(values.role) ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Student ID
                    </label>
                    <Input
                      placeholder="e.g. CSE-2021-001"
                      value={values.studentId}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          studentId: e.target.value,
                        }))
                      }
                    />
                    {errors.studentId ? (
                      <p className="text-xs text-red-400">{errors.studentId}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Phone number
                    </label>
                    <Input
                      placeholder="Optional"
                      value={values.phoneNumber}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                    {errors.phoneNumber ? (
                      <p className="text-xs text-red-400">
                        {errors.phoneNumber}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {isPassengerRole(values.role) ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Academic department
                      </label>
                      <Select
                        value={values.academicDepartment}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            academicDepartment: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select department</option>
                        {ACADEMIC_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Academic batch
                      </label>
                      <Input
                        placeholder={ACADEMIC_BATCH_PLACEHOLDER}
                        value={values.academicBatch}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            academicBatch: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Transport pickup point
                    </label>
                    <Input
                      placeholder="e.g. Main Gate"
                      value={values.transportPickupPoint}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          transportPickupPoint: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Status
                </label>
                <Select
                  value={values.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      isActive: e.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Student ID
                </label>
                <Input
                  placeholder="Optional"
                  value={values.studentId}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      studentId: e.target.value,
                    }))
                  }
                />
                {errors.studentId ? (
                  <p className="text-xs text-red-400">{errors.studentId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Phone number
                </label>
                <Input
                  placeholder="Optional"
                  value={values.phoneNumber}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                />
                {errors.phoneNumber ? (
                  <p className="text-xs text-red-400">{errors.phoneNumber}</p>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : mode === "create"
                  ? "Create user"
                  : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
