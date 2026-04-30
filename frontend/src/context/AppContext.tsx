import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { HealthScore, Alert, FarmSettings, Horse, Stall, getStatus } from "../data/types";
import { initialScores, defaultSettings } from "../data/mock";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:8000";

const LOCAL_HORSE_VIDEOS: Record<string, string> = {
  shadow: "horse-rolling-demo.mov",
  maple:  "horse-biting-demo.mov",
  bella:  "horse-lying-demo.mov",
};

const LOCAL_HORSE_IMAGES: Record<string, string> = {
  shadow: "shadow-avatar.png",
  rocky:  "rocky-avatar.png",
  maple:  "maple-avatar.png",
  bella:  "bella-avatar.png",
};

// Live MJPEG streams from screen capture
const LIVE_STREAMS: Record<string, string> = {
  rocky: "http://10.23.102.69:8001/stream",
};

export interface Toast {
  id: string;
  horseName: string;
  stallName: string;
  score: number;
  severity: "warning" | "critical";
  stallId: string;
}

interface AppState {
  scores: Record<string, HealthScore>;
  alerts: Alert[];
  settings: FarmSettings;
  toasts: Toast[];
  horses: Horse[];
  stalls: Stall[];
  acknowledgeAlert: (id: string, note?: string) => Promise<void>;
  resolveAlert: (id: string, note?: string) => Promise<void>;
  updateSettings: (settings: Partial<FarmSettings>) => Promise<void>;
  dismissToast: (id: string) => void;
  markStallChecked: (stallId: string) => void;
  checkedStalls: Record<string, string>;
}

const AppContext = createContext<AppState | null>(null);

type StallRow = { id: string; name: string; camera_status: "online" | "offline" };
type HorseRow = {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  stall_id: string | null;
  image_url: string | null;
  video_url: string | null;
};
type AlertRow = {
  id: string;
  stall_id: string;
  horse_id: string | null;
  timestamp: string;
  severity: "warning" | "critical";
  message: string;
  status: "new" | "acknowledged" | "resolved";
  acknowledged_at: string | null;
  resolved_at: string | null;
  note: string | null;
};
type FarmSettingsRow = {
  farm_name: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  vet_phone: string | null;
  alert_notifications: boolean;
  alert_sound: boolean;
  paranoia_level: number;
};

function stallFromRow(r: StallRow, horseId: string | null): Stall {
  return { id: r.id, name: r.name, horseId, cameraStatus: r.camera_status };
}

function horseFromRow(r: HorseRow): Horse {
  const nameLower = r.name?.toLowerCase() ?? "";
  const isLiveStream = !!LIVE_STREAMS[nameLower];

  let videoUrl: string | null = null;
  if (isLiveStream) {
    videoUrl = LIVE_STREAMS[nameLower];
  } else if (LOCAL_HORSE_VIDEOS[nameLower]) {
    videoUrl = `${API_BASE}/videos/${LOCAL_HORSE_VIDEOS[nameLower]}`;
  } else {
    videoUrl = r.video_url;
  }

  return {
    id: r.id,
    name: r.name,
    breed: r.breed ?? "",
    age: r.age ?? 0,
    stallId: r.stall_id ?? "",
    imageUrl: LOCAL_HORSE_IMAGES[nameLower]
      ? `${API_BASE}/videos/${LOCAL_HORSE_IMAGES[nameLower]}?v=${Date.now()}`
      : r.image_url ?? "",
    videoUrl,
    isLiveStream,
  };
}

function alertFromRow(r: AlertRow): Alert {
  return {
    id: r.id,
    stallId: r.stall_id,
    horseId: r.horse_id ?? "",
    timestamp: r.timestamp,
    severity: r.severity,
    message: r.message,
    status: r.status,
    acknowledgedAt: r.acknowledged_at ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
    note: r.note ?? undefined,
  };
}

function settingsFromRow(r: FarmSettingsRow): FarmSettings {
  return {
    farmName: r.farm_name ?? defaultSettings.farmName,
    ownerName: r.owner_name ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    vetPhone: r.vet_phone ?? "",
    alertNotifications: r.alert_notifications,
    alertSound: r.alert_sound,
    paranoiaLevel: r.paranoia_level,
  };
}

function settingsToRow(s: Partial<FarmSettings>): Partial<FarmSettingsRow> {
  const row: Partial<FarmSettingsRow> = {};
  if (s.farmName !== undefined) row.farm_name = s.farmName;
  if (s.ownerName !== undefined) row.owner_name = s.ownerName;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.email !== undefined) row.email = s.email;
  if (s.vetPhone !== undefined) row.vet_phone = s.vetPhone;
  if (s.alertNotifications !== undefined) row.alert_notifications = s.alertNotifications;
  if (s.alertSound !== undefined) row.alert_sound = s.alertSound;
  if (s.paranoiaLevel !== undefined) row.paranoia_level = s.paranoiaLevel;
  return row;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [scores, setScores] = useState<Record<string, HealthScore>>(initialScores);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<FarmSettings>(defaultSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [checkedStalls, setCheckedStalls] = useState<Record<string, string>>({});
  const [horses, setHorses] = useState<Horse[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const lastRiskRef = useRef<Record<string, number>>({});
  const horsesRef = useRef<Horse[]>([]);
  const stallsRef = useRef<Stall[]>([]);
  const alertNotificationsRef = useRef<boolean>(defaultSettings.alertNotifications);
  useEffect(() => { horsesRef.current = horses; }, [horses]);
  useEffect(() => { stallsRef.current = stalls; }, [stalls]);
  useEffect(() => { alertNotificationsRef.current = settings.alertNotifications; }, [settings.alertNotifications]);

  // Load horses, stalls, alerts, settings from Supabase.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [stallRes, horseRes, alertRes, settingsRes] = await Promise.all([
        supabase.from("stalls").select("*"),
        supabase.from("horses").select("*"),
        supabase.from("alerts").select("*").order("timestamp", { ascending: false }),
        supabase.from("farm_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (cancelled) return;

      const horseRows = (horseRes.data ?? []) as HorseRow[];
      const stallRows = (stallRes.data ?? []) as StallRow[];
      const horseByStall = new Map(horseRows.filter((h) => h.stall_id).map((h) => [h.stall_id!, h.id]));

      setHorses(horseRows.map(horseFromRow));
      setStalls(stallRows.map((s) => stallFromRow(s, horseByStall.get(s.id) ?? null)));
      setAlerts(((alertRes.data ?? []) as AlertRow[]).map(alertFromRow));

      if (settingsRes.data) {
        setSettings(settingsFromRow(settingsRes.data as FarmSettingsRow));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const acknowledgeAlert = useCallback(async (id: string, note?: string) => {
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "acknowledged", acknowledgedAt: now, note } : a))
    );
    await supabase
      .from("alerts")
      .update({ status: "acknowledged", acknowledged_at: now, note: note ?? null })
      .eq("id", id);
  }, []);

  const resolveAlert = useCallback(async (id: string, note?: string) => {
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "resolved", resolvedAt: now, note: note ?? a.note } : a))
    );
    await supabase
      .from("alerts")
      .update({ status: "resolved", resolved_at: now, ...(note !== undefined && { note }) })
      .eq("id", id);
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<FarmSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
      if (!user) return;
      await supabase
        .from("farm_settings")
        .upsert({ user_id: user.id, ...settingsToRow(partial) }, { onConflict: "user_id" });
    },
    [user?.id]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markStallChecked = useCallback((stallId: string) => {
    setCheckedStalls((prev) => ({ ...prev, [stallId]: new Date().toISOString() }));
  }, []);

  // CV backend polling for all horses
  useEffect(() => {
    if (horses.length === 0) return;
    let cancelled = false;

    const applyResult = (stallId: string, risk: number) => {
      const overall = (risk - 1) * 20 + 10;
      setScores((prev) => ({
        ...prev,
        [stallId]: {
          ...prev[stallId],
          overall,
          status: getStatus(overall),
          timestamp: new Date().toISOString(),
        },
      }));

      if (risk >= 3) {
        const nowMs = Date.now();
        const horse = horsesRef.current.find((h) => h.stallId === stallId);
        const stall = stallsRef.current.find((s) => s.id === stallId);
        if (horse && stall) {
          const severity = risk === 5 ? ("critical" as const) : ("warning" as const);
          const timestamp = new Date().toISOString();
          const isMaple = horse.name.toLowerCase() === "maple";
          const mapleOverrideSeverity = isMaple ? ("critical" as const) : severity;
          const message = isMaple
            ? `${horse.name} is biting at its stomach. Immediate attention required.`
            : mapleOverrideSeverity === "critical"
            ? `${horse.name} is rolling. Immediate attention required.`
            : `${horse.name} has been lying down for over an hour.`;

          const isNewEvent = risk !== lastRiskRef.current[stallId];

          setAlerts((prev) => {
            const existing = prev.find(
              (a) => a.stallId === stallId && a.status !== "resolved"
            );
            if (existing) {
              (async () => {
                await supabase
                  .from("alerts")
                  .update({ timestamp, severity: mapleOverrideSeverity, message })
                  .eq("id", existing.id);
              })();
              return prev.map((a) =>
                a.id === existing.id ? { ...a, timestamp, severity: mapleOverrideSeverity, message } : a
              );
            }
            (async () => {
              const { data } = await supabase
                .from("alerts")
                .insert({
                  stall_id: stallId,
                  horse_id: horse.id,
                  timestamp,
                  severity: mapleOverrideSeverity,
                  message,
                  status: "new",
                })
                .select()
                .single();
              if (data) {
                setAlerts((a) => [alertFromRow(data as AlertRow), ...a]);
              }
            })();
            return prev;
          });

          if (isNewEvent && alertNotificationsRef.current) {
            const tempId = `t-${nowMs}-${stallId}`;
            const toast: Toast = {
              id: tempId,
              horseName: horse.name,
              stallName: stall.name,
              score: overall,
              severity: mapleOverrideSeverity,
              stallId,
            };
            setToasts((t) => [...t, toast]);
            setTimeout(() => {
              setToasts((t) => t.filter((x) => x.id !== tempId));
            }, 8000);
          }
        }
      }
      lastRiskRef.current[stallId] = risk;
    };

    const tracked = horses
      .filter((h) => h.stallId && h.name.toLowerCase() !== "maple" && h.name.toLowerCase() !== "bella")
      .map((h) => ({ stallId: h.stallId, backendId: h.name.toLowerCase() }));

    const pollAll = async () => {
      await Promise.all(
        tracked.map(async ({ stallId, backendId }) => {
          try {
            const res = await fetch(`${API_BASE}/api/horses/${backendId}/status`);
            if (!res.ok) return;
            const job = await res.json();
            const risk = job?.results?.illness_risk_score;
            if (typeof risk === "number" && !cancelled) applyResult(stallId, risk);
          } catch {
            // backend unreachable
          }
        })
      );
    };

    const poll = setInterval(pollAll, 5000);
    pollAll();

    // Hardcoded Maple alert: fires a 4/5 alert once a minute.
    const maple = horses.find(
      (h) => h.name.toLowerCase() === "maple" && h.stallId
    );
    const mapleInterval = maple
      ? setInterval(() => {
          if (!cancelled) applyResult(maple.stallId, 4);
        }, 60000)
      : null;
    if (maple && !cancelled) applyResult(maple.stallId, 4);

    // Hardcoded Bella alert: fires a 3/5 alert once a minute.
    const bella = horses.find(
      (h) => h.name.toLowerCase() === "bella" && h.stallId
    );
    const bellaInterval = bella
      ? setInterval(() => {
          if (!cancelled) applyResult(bella.stallId, 3);
        }, 60000)
      : null;
    if (bella && !cancelled) applyResult(bella.stallId, 3);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (mapleInterval) clearInterval(mapleInterval);
      if (bellaInterval) clearInterval(bellaInterval);
    };
  }, [horses]);

  return (
    <AppContext.Provider
      value={{
        scores,
        alerts,
        settings,
        toasts,
        horses,
        stalls,
        checkedStalls,
        acknowledgeAlert,
        resolveAlert,
        updateSettings,
        dismissToast,
        markStallChecked,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
