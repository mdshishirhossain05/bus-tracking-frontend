"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function AdminPaginationBar({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-slate-800 bg-slate-900 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm leading-6 text-slate-500">
        Page <span className="font-medium text-slate-100">{page}</span> of{" "}
        <span className="font-medium text-slate-100">{totalPages}</span> (
        <span className="font-medium text-slate-100">{total}</span> total)
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="w-full sm:w-[140px]">
          <Select
            value={String(limit)}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex-1 sm:flex-none"
          >
            Previous
          </Button>

          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex-1 sm:flex-none"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}