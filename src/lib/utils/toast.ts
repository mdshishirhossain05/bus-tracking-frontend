import { getApiErrorMessage } from "@/lib/api/error";
import { messages } from "@/lib/constants/messages";

export function handleCreateSuccess(toast: any, entity: string) {
  const msg = messages.success.created(entity);
  toast.success(msg.title, msg.description);
}

export function handleUpdateSuccess(toast: any, entity: string) {
  const msg = messages.success.updated(entity);
  toast.success(msg.title, msg.description);
}

export function handleDeleteSuccess(toast: any, entity: string) {
  const msg = messages.success.deleted(entity);
  toast.success(msg.title, msg.description);
}

export function handleSavedSuccess(toast: any) {
  toast.success(
    messages.success.saved.title,
    messages.success.saved.description,
  );
}

export function handleRevokedSuccess(toast: any, entity: string) {
  const msg = messages.success.revoked(entity);
  toast.success(msg.title, msg.description);
}

export function handleApiError(
  toast: any,
  error: unknown,
  type: "create" | "update" | "delete",
  entity: string,
) {
  const msg = messages.error[type](entity);
  toast.danger(msg.title, getApiErrorMessage(error, msg.fallback));
}

export function handleConflict(toast: any, entity: string, details?: string) {
  const msg = messages.conflict.delete(entity, details);
  toast.warning(msg.title, msg.description);
}
