"use client";

import { useEffect, useMemo, useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage, getApiStatusCode } from "@/lib/api/error";
import { useToast } from "@/providers/toast-provider";
import type {
  DayType,
  ServiceScheduleItem,
} from "./api/admin.service-schedules.api";
import {
  ServiceScheduleDeleteDialog,
  type ServiceScheduleActionType,
} from "./components/service-schedule-delete-dialog";
import { ServiceScheduleFormModal } from "./components/service-schedule-form-modal";
import { ServiceSchedulesTable } from "./components/service-schedules-table";
import { useAdminServiceSchedules } from "./hooks/use-admin-service-schedules";
import { AdminFilterBar } from "../shared/components/admin-filter-bar";
import { AdminPaginationBar } from "../shared/components/admin-pagination-bar";
import { AdminListStats } from "../shared/components/admin-list-stats";

type ModalState =
  | { type: "create" }
  | { type: "edit"; item: ServiceScheduleItem }
  | {
      type: "action";
      actionType: ServiceScheduleActionType;
      item: ServiceScheduleItem;
    }
  | null;

function buildScheduleErrorMessage(error: unknown) {
  const status = getApiStatusCode(error as any);
  const message = getApiErrorMessage(error);

  if (status === 409) {
    const details = (error as any)?.response?.data?.details;
    const routeName = details?.routeName ? `Route: ${details.routeName}` : null;
    const busCode = details?.busCode ? `Bus: ${details.busCode}` : null;
    const driverName = details?.driverName
      ? `Driver: ${details.driverName}`
      : null;

    const extra = [routeName, busCode, driverName].filter(Boolean).join(" • ");
    return extra ? `${message} (${extra})` : message;
  }

  return message;
}

const DAY_OPTIONS: DayType[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function AdminServiceSchedulesPage() {
  const toast = useToast();

  const {
    items,
    loading,
    meta,
    query,
    reload,
    setPage,
    setLimit,
    setSearch,
    setDayType,
    setIsActive,
    resetFilters,
    create,
    update,
    archive,
    restore,
    permanentDelete,
  } = useAdminServiceSchedules();

  const [searchInput, setSearchInput] = useState(query.search);
  const [dayTypeInput, setDayTypeInput] = useState<DayType | "ALL">(
    query.dayType,
  );
  const [statusInput, setStatusInput] = useState<"ALL" | "true" | "false">(
    query.isActive,
  );

  const [modal, setModal] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);

  useEffect(() => {
    setSearchInput(query.search);
    setDayTypeInput(query.dayType);
    setStatusInput(query.isActive);
  }, [query.dayType, query.isActive, query.search]);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const archivedCount = useMemo(
    () => items.filter((item) => !item.isActive).length,
    [items],
  );

  function closeModal() {
    setModal(null);
    setModalError(null);
    setSubmitting(false);
  }

  async function handleReload() {
    try {
      setLoadFailed(false);
      await reload();
    } catch {
      setLoadFailed(true);
    }
  }

  async function handleApplyFilters() {
    try {
      setApplyingFilters(true);
      setLoadFailed(false);

      setSearch(searchInput);
      setDayType(dayTypeInput);
      setIsActive(statusInput);
    } finally {
      setApplyingFilters(false);
    }
  }

  async function handleResetFilters() {
    try {
      setApplyingFilters(true);
      setLoadFailed(false);

      setSearchInput("");
      setDayTypeInput("ALL");
      setStatusInput("ALL");
      resetFilters();
    } finally {
      setApplyingFilters(false);
    }
  }

  async function handleCreate(values: {
    routeId: string;
    busId: string;
    driverId: string | null;
    dayType: DayType;
    departureTime: string;
    isActive: boolean;
    notes: string | null;
  }) {
    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await create(values);

      setSearchInput("");
      setDayTypeInput("ALL");
      setStatusInput("ALL");

      toast.success(
        "Schedule created",
        "The service schedule has been created successfully.",
      );
      closeModal();
    } catch (error) {
      const message = buildScheduleErrorMessage(error);
      setModalError(message);
      toast.danger("Create failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: {
    routeId: string;
    busId: string;
    driverId: string | null;
    dayType: DayType;
    departureTime: string;
    isActive: boolean;
    notes: string | null;
  }) {
    if (!modal || modal.type !== "edit") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await update(modal.item.id, values);

      toast.success(
        "Schedule updated",
        "The service schedule has been updated successfully.",
      );
      closeModal();
    } catch (error) {
      const message = buildScheduleErrorMessage(error);
      setModalError(message);
      toast.danger("Update failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActionConfirm() {
    if (!modal || modal.type !== "action") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      if (modal.actionType === "archive") {
        const result = await archive(modal.item.id);

        toast.success(
          result.alreadyArchived ? "Already archived" : "Schedule archived",
          result.alreadyArchived
            ? "This schedule was already archived."
            : "The schedule has been archived safely.",
        );
      } else if (modal.actionType === "restore") {
        const result = await restore(modal.item.id);

        toast.success(
          result.alreadyRestored ? "Already active" : "Schedule restored",
          result.alreadyRestored
            ? "This schedule was already active."
            : "The archived schedule has been restored.",
        );
      } else {
        const result = await permanentDelete(modal.item.id);

        const unlinkNote =
          result.unlinkedTripCount > 0
            ? ` ${result.unlinkedTripCount} linked trip record(s) were unlinked first.`
            : "";

        toast.success(
          "Schedule permanently deleted",
          `Archived schedule removed permanently.${unlinkNote}`,
        );
      }

      closeModal();
    } catch (error: any) {
      const status = getApiStatusCode(error);
      const msg = getApiErrorMessage(error);

      if (status === 409) {
        setModalError(msg);
        toast.warning("Action blocked", msg);
      } else {
        setModalError(msg);
        toast.danger("Action failed", msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <SectionSkeleton />;
  }

  if (loadFailed) {
    return (
      <ErrorState
        description="Service schedules could not be loaded from the server."
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Service schedules"
        description="Manage operational schedules connecting ready routes, active buses, and active drivers."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void handleReload()}>
              Refresh
            </Button>
            <Button onClick={() => setModal({ type: "create" })}>
              Create schedule
            </Button>
          </div>
        }
      >
        <Card className="border-slate-800 bg-slate-950/70">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-100">
                Schedule lifecycle
              </p>
              <p className="text-sm text-slate-400">
                Active schedules can be archived safely. Archived schedules can
                be restored or permanently deleted later. Permanent delete is
                intended only for archived schedules.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Archive as default safe action</Badge>
              <Badge tone="neutral">Restore archived schedules</Badge>
              <Badge tone="warning">Permanent delete only after archive</Badge>
            </div>
          </CardContent>
        </Card>

        <AdminListStats
          items={[
            { label: "Total schedules", value: meta.total },
            { label: "Active on page", value: activeCount },
            { label: "Archived on page", value: archivedCount },
            { label: "Total pages", value: meta.totalPages },
          ]}
        />

        <AdminFilterBar
          onApply={() => void handleApplyFilters()}
          onReset={() => void handleResetFilters()}
          applying={applyingFilters}
        >
          <Input
            placeholder="Search by route, bus, driver, time, or notes"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleApplyFilters();
              }
            }}
          />

          <Select
            value={dayTypeInput}
            onChange={(e) =>
              setDayTypeInput(e.target.value as DayType | "ALL")
            }
          >
            <option value="ALL">All days</option>
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </Select>

          <Select
            value={statusInput}
            onChange={(e) =>
              setStatusInput(e.target.value as "ALL" | "true" | "false")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Archived</option>
          </Select>

          <Select
            value={String(meta.limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </AdminFilterBar>

        {items.length === 0 ? (
          <EmptyState
            title="No schedules found"
            description="No service schedules match the current filters. Adjust filters or create a new schedule after route, bus, driver, and route-stop setup are ready."
            actionLabel="Create schedule"
            onAction={() => setModal({ type: "create" })}
          />
        ) : (
          <ServiceSchedulesTable
            items={items}
            onEdit={(item) => setModal({ type: "edit", item })}
            onAction={(actionType, item) =>
              setModal({ type: "action", actionType, item })
            }
          />
        )}

        <AdminPaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={(page) => setPage(page)}
          onLimitChange={(limit) => setLimit(limit)}
        />
      </PageSection>

      {modal?.type === "create" ? (
        <ServiceScheduleFormModal
          submitting={submitting}
          errorMessage={modalError}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <ServiceScheduleFormModal
          initial={modal.item}
          submitting={submitting}
          errorMessage={modalError}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "action" ? (
        <ServiceScheduleDeleteDialog
          schedule={modal.item}
          actionType={modal.actionType}
          submitting={submitting}
          errorMessage={modalError}
          onConfirm={handleActionConfirm}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}