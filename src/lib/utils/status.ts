export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "disconnected"
  | "stale"
  | "error";

export type TripHealthStatus =
  | "active"
  | "ended"
  | "delayed"
  | "idle"
  | "unknown";

export function getConnectionTone(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return "success";
    case "connecting":
    case "reconnecting":
      return "warning";
    case "stale":
      return "warning";
    case "error":
      return "danger";
    case "disconnected":
    default:
      return "neutral";
  }
}

export function getTripHealthTone(status: TripHealthStatus) {
  switch (status) {
    case "active":
      return "success";
    case "delayed":
      return "warning";
    case "ended":
      return "danger";
    case "idle":
      return "neutral";
    default:
      return "info";
  }
}
