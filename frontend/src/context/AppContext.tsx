import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { HealthScore, Alert, FarmSettings, Horse, Stall, getStatus } from "../data/types";
import { initialScores, defaultSettings } from "../data/mock";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:8000";
const BELLA_STALL_ID = "s2";

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
  return {
    id: r.id,
    name: r.name,
    breed: r.breed ?? "",
    age: r.age ?? 0,
    stallId: r.stall_id ?? "",
    imageUrl: r.image_url ?? "",
    videoUrl: r.video_url,
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
  const alertCooldowns = useRef<Record<string, number>>({});
  const lastBellaRiskRef = useRef<number | null>(null);
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

  // Bella CV backend polling
  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const applyResult = (risk: number) => {
      const overall = (risk - 1) * 20 + 10;
      setScores((prev) => ({
        ...prev,
        [BELLA_STALL_ID]: {
          ...prev[BELLA_STALL_ID],
          overall,
          status: getStatus(overall),
          timestamp: new Date().toISOString(),
        },
      }));

      if (risk >= 3 && risk !== lastBellaRiskRef.current) {
        const lastAlert = alertCooldowns.current[BELLA_STALL_ID] || 0;
        const nowMs = Date.now();
        if (nowMs - lastAlert > 5 * 60 * 1000) {
          alertCooldowns.current[BELLA_STALL_ID] = nowMs;
          const horse = horsesRef.current.find((h) => h.stallId === BELLA_STALL_ID);
          const stall = stallsRef.current.find((s) => s.id === BELLA_STALL_ID);
          if (horse && stall) {
            const severity = risk === 5 ? ("critical" as const) : ("warning" as const);
            const timestamp = new Date().toISOString();
            const message = `${horse.name}'s illness risk is ${risk}/5. ${
              severity === "critical" ? "Immediate attention required." : "Behavioral changes detected."
            }`;

            (async () => {
              const { data } = await supabase
                .from("alerts")
                .insert({
                  stall_id: BELLA_STALL_ID,
                  horse_id: horse.id,
                  timestamp,
                  severity,
                  message,
                  status: "new",
                })
                .select()
                .single();
              if (data) {
                setAlerts((a) => [alertFromRow(data as AlertRow), ...a]);
              }
            })();

            if (alertNotificationsRef.current) {
              const tempId = `t-${nowMs}-${BELLA_STALL_ID}`;
              const toast: Toast = {
                id: tempId,
                horseName: horse.name,
                stallName: stall.name,
                score: overall,
                severity,
                stallId: BELLA_STALL_ID,
              };
              setToasts((t) => [...t, toast]);
              setTimeout(() => {
                setToasts((t) => t.filter((x) => x.id !== tempId));
              }, 8000);
            }
          }
        }
      }
      lastBellaRiskRef.current = risk;
    };

    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/horses/bella/status`);
        if (!res.ok) return;
        const job = await res.json();
        const risk = job?.results?.illness_risk_score;
        if (typeof risk === "number") applyResult(risk);
      } catch {
        // backend unreachable
      }
    };

    (async () => {
      try {
        await fetch(`${API_BASE}/api/horses/bella/analyze`, { method: "POST" });
      } catch {
        return;
      }
      if (cancelled) return;
      poll = setInterval(pollStatus, 5000);
      pollStatus();
    })();

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, []);

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
