"use client";

import { useEffect, useMemo, useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, getApiStatusCode } from "@/lib/api/error";
import { messages } from "@/lib/constants/messages";
import {
  handleApiError,
  handleConflict,
  handleCreateSuccess,
  handleDeleteSuccess,
  handleUpdateSuccess,
} from "@/lib/utils/toast";
import { useToast } from "@/providers/toast-provider";
import type { StopItem } from "./api/admin.stops.api";
import { StopDeleteDialog } from "./components/stop-delete-dialog";
import { StopFormModal } from "./components/stop-form-modal";
import { StopsTable } from "./components/stops-table";
import { useAdminStops } from "./hooks/use-admin-stops";
import { AdminFilterBar } from "../shared/components/admin-filter-bar";
import { AdminPaginationBar } from "../shared/components/admin-pagination-bar";
import { AdminListStats } from "../shared/components/admin-list-stats";

type ModalState =
  | { type: "create" }
  | { type: "edit"; stop: StopItem }
  | { type: "delete"; stop: StopItem }
  | null;

export function AdminStopsPage() {
  const {
    stops,
    allStops,
    filteredCount,
    loading,
    meta,
    query,
    reload,
    setSearch,
    setIsActive,
    setPage,
    setLimit,
    resetFilters,
    createStop,
    updateStop,
    deleteStop,
  } = useAdminStops();

  const toast = useToast();

  const [searchInput, setSearchInput] = useState(query.search);
  const [statusInput, setStatusInput] = useState<"ALL" | "true" | "false">(
    query.isActive,
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);

  useEffect(() => {
    setSearchInput(query.search);
    setStatusInput(query.isActive);
  }, [query.search, query.isActive]);

  const activeCount = useMemo(
    () => allStops.filter((stop) => stop.isActive).length,
    [allStops],
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
      setStatusInput("ALL");
      resetFilters();
    } finally {
      setApplyingFilters(false);
    }
  }

  async function handleCreate(values: {
    stopName: string;
    stopCode?: string | null;
    landmark?: string | null;
    address?: string | null;
    notes?: string | null;
    isActive?: boolean;
    lat: number;
    lng: number;
  }) {
    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await createStop(values);

      setSearchInput("");
      setStatusInput("ALL");

      handleCreateSuccess(toast, "Stop");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "create", "Stop");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: {
    stopName: string;
    stopCode?: string | null;
    landmark?: string | null;
    address?: string | null;
    notes?: string | null;
    isActive?: boolean;
    lat: number;
    lng: number;
  }) {
    if (!modal || modal.type !== "edit") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await updateStop(modal.stop.id, values);

      handleUpdateSuccess(toast, "Stop");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "update", "Stop");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!modal || modal.type !== "delete") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await deleteStop(modal.stop.id);

      handleDeleteSuccess(toast, "Stop");
      closeModal();
    } catch (error: any) {
      const status = getApiStatusCode(error);
      const message = getApiErrorMessage(error, "Failed to delete stop.");

      if (status === 409) {
        const dependencies = error?.response?.data?.dependencies;
        const details =
          dependencies && typeof dependencies === "object"
            ? `In use by: ${Object.entries(dependencies)
                .filter(([, value]) => Number(value) > 0)
                .map(([key, value]) => `${key} (${value})`)
                .join(", ")}`
            : message;

        setModalError(details);
        handleConflict(toast, "Stop", details);
      } else {
        setModalError(message);
        handleApiError(toast, error, "delete", "Stop");
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
        description={messages.error.load("Stops").description}
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Stops registry"
        description="Manage physical bus stops used across routes, scheduling, and tracking."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void handleReload()}>
              Refresh
            </Button>
            <Button onClick={() => setModal({ type: "create" })}>
              Create stop
            </Button>
          </div>
        }
      >
        <AdminListStats
          items={[
            { label: "Total stops", value: allStops.length },
            { label: "Active stops", value: activeCount },
            { label: "Inactive stops", value: allStops.length - activeCount },
            { label: "Filtered results", value: filteredCount },
          ]}
        />

        <AdminFilterBar
          onApply={() => void handleApplyFilters()}
          onReset={() => void handleResetFilters()}
          applying={applyingFilters}
        >
          <Input
            placeholder="Search by name, code, landmark, address, or coordinates"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleApplyFilters();
              }
            }}
          />

          <select
            className="h-11 rounded-sm border border-slate-800 bg-slate-900 px-3.5 text-sm text-slate-100 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            value={statusInput}
            onChange={(e) =>
              setStatusInput(e.target.value as "ALL" | "true" | "false")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <div />

          <select
            className="h-11 rounded-sm border border-slate-800 bg-slate-900 px-3.5 text-sm text-slate-100 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            value={String(meta.limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </AdminFilterBar>

        {stops.length === 0 ? (
          <EmptyState
            title={
              allStops.length === 0
                ? messages.empty.noData("Stops").title
                : messages.empty.noResults("Stops").title
            }
            description={
              allStops.length === 0
                ? "Create the first stop to begin route design and operational planning."
                : messages.empty.noResults("Stops").description
            }
            actionLabel={allStops.length === 0 ? "Create stop" : undefined}
            onAction={
              allStops.length === 0
                ? () => setModal({ type: "create" })
                : undefined
            }
          />
        ) : (
          <StopsTable
            stops={stops}
            onEdit={(stop) => setModal({ type: "edit", stop })}
            onDelete={(stop) => setModal({ type: "delete", stop })}
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
        <StopFormModal
          allStops={allStops}
          submitting={submitting}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <StopFormModal
          initial={modal.stop}
          allStops={allStops}
          submitting={submitting}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <StopDeleteDialog
          stop={modal.stop}
          submitting={submitting}
          errorMessage={modalError}
          onConfirm={handleDeleteConfirm}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}