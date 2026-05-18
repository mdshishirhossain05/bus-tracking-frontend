"use client";

import { useEffect, useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import type { AdminRouteItem } from "./api/admin.routes.api";
import { RouteDeleteDialog } from "./components/route-delete-dialog";
import { RouteFormModal } from "./components/route-form-modal";
import { RoutesTable } from "./components/routes-table";
import { useAdminRoutes } from "./hooks/use-admin-routes";
import { AdminFilterBar } from "../shared/components/admin-filter-bar";
import { AdminPaginationBar } from "../shared/components/admin-pagination-bar";
import { AdminListStats } from "../shared/components/admin-list-stats";

type ModalState =
  | { type: "create" }
  | { type: "edit"; route: AdminRouteItem }
  | { type: "delete"; route: AdminRouteItem }
  | null;

export function AdminRoutesPage() {
  const {
    routes,
    allRoutes,
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
    activeCount,
    createRoute,
    updateRoute,
    deleteRoute,
  } = useAdminRoutes();

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
    routeName: string;
    description: string | null;
    isActive: boolean;
  }) {
    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await createRoute(values);

      setSearchInput("");
      setStatusInput("ALL");

      handleCreateSuccess(toast, "Route");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "create", "Route");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: {
    routeName: string;
    description: string | null;
    isActive: boolean;
  }) {
    if (!modal || modal.type !== "edit") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await updateRoute(modal.route.id, values);

      handleUpdateSuccess(toast, "Route");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "update", "Route");
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

      await deleteRoute(modal.route.id);

      handleDeleteSuccess(toast, "Route");
      closeModal();
    } catch (error: any) {
      const status = getApiStatusCode(error);
      const message = getApiErrorMessage(error, "Failed to delete route.");

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
        handleConflict(toast, "Route", details);
      } else {
        setModalError(message);
        handleApiError(toast, error, "delete", "Route");
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
        description={messages.error.load("Routes").description}
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Route registry"
        description="Manage route definitions before assigning stops, buses, and service schedules."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void handleReload()}>
              Refresh
            </Button>
            <Button onClick={() => setModal({ type: "create" })}>
              Create route
            </Button>
          </div>
        }
      >
        <AdminListStats
          items={[
            { label: "Total routes", value: allRoutes.length },
            { label: "Active routes", value: activeCount },
            { label: "Filtered results", value: filteredCount },
            { label: "Current page", value: meta.page },
          ]}
        />

        <AdminFilterBar
          onApply={() => void handleApplyFilters()}
          onReset={() => void handleResetFilters()}
          applying={applyingFilters}
        >
          <Input
            placeholder="Search by route name or description"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleApplyFilters();
              }
            }}
          />

          <Select
            value={statusInput}
            onChange={(e) =>
              setStatusInput(e.target.value as "ALL" | "true" | "false")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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

        {routes.length === 0 ? (
          <EmptyState
            title={
              allRoutes.length === 0
                ? messages.empty.noData("Routes").title
                : messages.empty.noResults("Routes").title
            }
            description={
              allRoutes.length === 0
                ? "Create the first route to begin route-stop design and service assignment."
                : messages.empty.noResults("Routes").description
            }
            actionLabel={allRoutes.length === 0 ? "Create route" : undefined}
            onAction={
              allRoutes.length === 0
                ? () => setModal({ type: "create" })
                : undefined
            }
          />
        ) : (
          <RoutesTable
            routes={routes}
            onEdit={(route) => setModal({ type: "edit", route })}
            onDelete={(route) => setModal({ type: "delete", route })}
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
        <RouteFormModal
          submitting={submitting}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <RouteFormModal
          initial={modal.route}
          submitting={submitting}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <RouteDeleteDialog
          route={modal.route}
          submitting={submitting}
          errorMessage={modalError}
          onConfirm={handleDeleteConfirm}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}