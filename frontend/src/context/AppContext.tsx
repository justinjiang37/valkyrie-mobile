import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { HealthScore, Alert, FarmSettings, getStatus } from "../data/types";
import { initialScores, initialAlerts, defaultSettings, horses, stalls } from "../data/mock";

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
  acknowledgeAlert: (id: string, note?: string) => void;
  resolveAlert: (id: string) => void;
  updateSettings: (settings: Partial<FarmSettings>) => void;
  dismissToast: (id: string) => void;
  markStallChecked: (stallId: string) => void;
  checkedStalls: Record<string, string>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [scores, setScores] = useState<Record<string, HealthScore>>(initialScores);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [settings, setSettings] = useState<FarmSettings>(defaultSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [checkedStalls, setCheckedStalls] = useState<Record<string, string>>({});
  const alertCooldowns = useRef<Record<string, number>>({});

  const acknowledgeAlert = useCallback((id: string, note?: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: "acknowledged" as const, acknowledgedAt: new Date().toISOString(), note } : a
    ));
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: "resolved" as const, resolvedAt: new Date().toISOString() } : a
    ));
  }, []);

  const updateSettings = useCallback((partial: Partial<FarmSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markStallChecked = useCallback((stallId: string) => {
    setCheckedStalls(prev => ({ ...prev, [stallId]: new Date().toISOString() }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setScores(prev => {
        const next = { ...prev };
        for (const stallId of Object.keys(next)) {
          if (stallId === BELLA_STALL_ID) continue;
          const old = next[stallId];
          const prevOverall = old.overall;

          const movement = Math.max(0, Math.min(100, old.movement + (Math.random() - 0.5) * 6));
          const posture = Math.max(0, Math.min(100, old.posture + (Math.random() - 0.5) * 6));
          const feeding = Math.max(0, Math.min(100, old.feeding + (Math.random() - 0.5) * 6));
          const activity = Math.max(0, Math.min(100, old.activity + (Math.random() - 0.5) * 6));
          const overall = Math.round(movement * 0.35 + posture * 0.25 + feeding * 0.25 + activity * 0.15);
          const status = getStatus(overall);

          next[stallId] = {
            ...old,
            overall,
            movement: Math.round(movement),
            posture: Math.round(posture),
            feeding: Math.round(feeding),
            activity: Math.round(activity),
            status,
            timestamp: new Date().toISOString(),
          };

          const threshold = 80 - (settings.paranoiaLevel - 1) * 10;
          if (overall >= threshold && prevOverall < threshold) {
            const lastAlert = alertCooldowns.current[stallId] || 0;
            const now = Date.now();
            if (now - lastAlert > 5 * 60 * 1000) {
              alertCooldowns.current[stallId] = now;
              const horse = horses.find(h => h.stallId === stallId);
              const stall = stalls.find(s => s.id === stallId);
              if (horse && stall) {
                const severity = overall >= 80 ? "critical" as const : "warning" as const;
                const newAlert: Alert = {
                  id: `a-${Date.now()}-${stallId}`,
                  stallId,
                  horseId: horse.id,
                  timestamp: new Date().toISOString(),
                  severity,
                  message: `${horse.name}'s risk score elevated to ${overall}. ${severity === "critical" ? "Immediate attention required." : "Behavioral changes detected."}`,
                  status: "new",
                };
                setAlerts(a => [newAlert, ...a]);

                if (settings.alertNotifications) {
                  const toast: Toast = {
                    id: newAlert.id,
                    horseName: horse.name,
                    stallName: stall.name,
                    score: overall,
                    severity,
                    stallId,
                  };
                  setToasts(t => [...t, toast]);
                  setTimeout(() => {
                    setToasts(t => t.filter(x => x.id !== toast.id));
                  }, 8000);
                }
              }
            }
          }
        }
        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [settings.alertNotifications, settings.paranoiaLevel]);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const applyResult = (risk: number) => {
      const overall = (risk - 1) * 20 + 10;
      setScores(prev => ({
        ...prev,
        [BELLA_STALL_ID]: {
          ...prev[BELLA_STALL_ID],
          overall,
          status: getStatus(overall),
          timestamp: new Date().toISOString(),
        },
      }));
    };

    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/horses/bella/status`);
        if (!res.ok) return;
        const job = await res.json();
        const risk = job?.results?.illness_risk_score;
        if (typeof risk === "number") applyResult(risk);
      } catch {
        // backend unreachable — keep last known value
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
    <AppContext.Provider value={{
      scores, alerts, settings, toasts, checkedStalls,
      acknowledgeAlert, resolveAlert, updateSettings, dismissToast, markStallChecked,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
