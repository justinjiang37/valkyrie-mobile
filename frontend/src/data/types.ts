export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  stallId: string;
  imageUrl: string;
  videoUrl?: string | null;
  isLiveStream?: boolean; // true for MJPEG streams
}

export interface Stall {
  id: string;
  name: string;
  horseId: string | null;
  cameraStatus: "online" | "offline";
}

export interface HealthScore {
  stallId: string;
  timestamp: string;
  overall: number;
  movement: number;
  posture: number;
  feeding: number;
  activity: number;
  status: "healthy" | "watch" | "at-risk" | "critical";
}

export interface Alert {
  id: string;
  stallId: string;
  horseId: string;
  timestamp: string;
  severity: "warning" | "critical";
  message: string;
  status: "new" | "acknowledged" | "resolved";
  acknowledgedAt?: string;
  resolvedAt?: string;
  note?: string;
}

export interface Annotation {
  id: string;
  stallId: string;
  timestamp: string;
  type: "movement" | "posture" | "feeding" | "activity";
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface FarmSettings {
  farmName: string;
  ownerName: string;
  phone: string;
  email: string;
  vetPhone: string;
  alertNotifications: boolean;
  alertSound: boolean;
  paranoiaLevel: number;
}

export function getStatus(score: number): HealthScore["status"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "at-risk";
  if (score >= 30) return "watch";
  return "healthy";
}

export function getStatusColor(status: HealthScore["status"]): string {
  switch (status) {
    case "healthy": return "#22c55e";
    case "watch": return "#eab308";
    case "at-risk": return "#f97316";
    case "critical": return "#ef4444";
  }
}

export function toFiveScale(overall: number): number {
  return Math.max(1, Math.min(5, Math.floor(overall / 20) + 1));
}

export function getStatusLabel(status: HealthScore["status"]): string {
  switch (status) {
    case "healthy": return "Healthy";
    case "watch": return "Watch";
    case "at-risk": return "At Risk";
    case "critical": return "Critical";
  }
}
