export type ToastTone = "success" | "info" | "warning" | "danger";

export interface AppToast {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}
