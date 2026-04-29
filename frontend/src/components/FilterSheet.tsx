import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { BottomSheet } from "./BottomSheet";
import { StatusTag } from "./StatusTag";
import { Colors } from "../constants/theme";
import { type } from "../constants/typography";

export type AlertFilters = {
  urgency: Set<"critical" | "warning">;
  horseIds: Set<string>;
  date: Date | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  horses: { id: string; name: string }[];
  filters: AlertFilters;
  onApply: (filters: AlertFilters) => void;
}

function CheckIcon() {
  return (
    <Svg width={14} height={10} viewBox="0 0 14 10" fill="none">
      <Path d="M1 5l4 4L13 1" stroke={Colors.textPrimary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={14} height={8} viewBox="0 0 14 8" fill="none">
      <Path d="M1 1l6 6 6-6" stroke="rgba(43,41,35,0.4)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color = Colors.textPrimary }: { color?: string }) {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
      <Path d="M1 1l6 6-6 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon() {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
      <Path d="M7 1L1 7l6 6" stroke={Colors.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.checkbox, checked && styles.checkboxChecked]} activeOpacity={0.7}>
      {checked && <CheckIcon />}
    </TouchableOpacity>
  );
}

function SectionHeader({
  label,
  collapsed,
  onToggle,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {collapsed ? <ChevronDownIcon /> : (
        <Svg width={14} height={3} viewBox="0 0 14 3" fill="none">
          <Path d="M1 1.5h12" stroke="rgba(43,41,35,0.4)" strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["S", "M", "T", "W", "Th", "F", "S"];

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function Calendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selected ? selected.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? selected.getMonth() : today.getMonth()
  );

  const days = buildCalendarDays(viewYear, viewMonth);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (d: number) =>
    selected &&
    selected.getDate() === d &&
    selected.getMonth() === viewMonth &&
    selected.getFullYear() === viewYear;

  const isToday = (d: number) =>
    today.getDate() === d &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <View style={styles.calendarMonthRow}>
          <Text style={styles.calendarMonth}>{monthName} {viewYear}</Text>
          <ChevronRightIcon color="rgba(43,41,35,0.4)" />
        </View>
        <View style={styles.calendarNavRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn} activeOpacity={0.7}>
            <ChevronLeftIcon />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn} activeOpacity={0.7}>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        <View style={styles.weekDaysRow}>
          {WEEK_DAYS.map((d, i) => (
            <View key={i} style={styles.dayCell}>
              <Text style={styles.weekDayLabel}>{d}</Text>
            </View>
          ))}
        </View>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.weekRow}>
            {row.map((d, ci) => (
              <View key={ci} style={styles.dayCell}>
                {d !== null && (
                  <TouchableOpacity
                    onPress={() => onSelect(new Date(viewYear, viewMonth, d))}
                    style={[
                      styles.dayBtn,
                      isSelected(d) && styles.dayBtnSelected,
                      !isSelected(d) && isToday(d) && styles.dayBtnToday,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected(d) && styles.dayTextSelected,
                        !isSelected(d) && isToday(d) && styles.dayTextToday,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FilterSheet({ open, onClose, horses, filters, onApply }: Props) {
  const [urgency, setUrgency] = useState<Set<"critical" | "warning">>(
    new Set(filters.urgency)
  );
  const [horseIds, setHorseIds] = useState<Set<string>>(new Set(filters.horseIds));
  const [date, setDate] = useState<Date | null>(filters.date);

  const [urgencyCollapsed, setUrgencyCollapsed] = useState(false);
  const [horseCollapsed, setHorseCollapsed] = useState(false);
  const [dateCollapsed, setDateCollapsed] = useState(false);

  const toggleUrgency = (v: "critical" | "warning") => {
    setUrgency(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const toggleHorse = (id: string) => {
    setHorseIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearAll = () => {
    setUrgency(new Set());
    setHorseIds(new Set());
    setDate(null);
  };

  const apply = () => {
    onApply({ urgency, horseIds, date });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency */}
        <View style={styles.section}>
          <SectionHeader
            label="URGENCY"
            collapsed={urgencyCollapsed}
            onToggle={() => setUrgencyCollapsed(c => !c)}
          />
          {!urgencyCollapsed && (
            <View style={styles.sectionRows}>
              <View style={styles.filterRow}>
                <View style={styles.filterRowLeft}>
                  <StatusTag status="critical" />
                  <Text style={styles.filterRowLabel}>Critical</Text>
                </View>
                <Checkbox checked={urgency.has("critical")} onPress={() => toggleUrgency("critical")} />
              </View>
              <View style={styles.filterRow}>
                <View style={styles.filterRowLeft}>
                  <StatusTag status="warning" />
                  <Text style={styles.filterRowLabel}>Warning</Text>
                </View>
                <Checkbox checked={urgency.has("warning")} onPress={() => toggleUrgency("warning")} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Horse */}
        <View style={styles.section}>
          <SectionHeader
            label="HORSE"
            collapsed={horseCollapsed}
            onToggle={() => setHorseCollapsed(c => !c)}
          />
          {!horseCollapsed && (
            <View style={styles.sectionRows}>
              {horses.map(h => (
                <View key={h.id} style={styles.filterRow}>
                  <Text style={styles.filterRowLabel}>{h.name}</Text>
                  <Checkbox checked={horseIds.has(h.id)} onPress={() => toggleHorse(h.id)} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Date */}
        <View style={styles.section}>
          <SectionHeader
            label="DATE"
            collapsed={dateCollapsed}
            onToggle={() => setDateCollapsed(c => !c)}
          />
          {!dateCollapsed && (
            <Calendar selected={date} onSelect={d => setDate(prev => prev?.toDateString() === d.toDateString() ? null : d)} />
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.applyBtn} onPress={apply} activeOpacity={0.85}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 600 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 0 },

  section: { paddingVertical: 16, gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  sectionRows: { gap: 16 },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterRowLabel: {
    ...type.callout,
    color: Colors.textPrimary,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.background,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
  },

  // Calendar
  calendar: { gap: 16 },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarMonthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calendarMonth: {
    ...type.callout,
    color: Colors.textPrimary,
  },
  calendarNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  calendarNavBtn: {
    padding: 4,
  },
  calendarGrid: { gap: 4 },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnSelected: {
    backgroundColor: Colors.textPrimary,
  },
  dayBtnToday: {
    backgroundColor: "#efede4",
  },
  dayText: {
    ...type.callout,
    color: Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: "600",
  },
  dayTextToday: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },

  // Buttons
  buttons: { gap: 12, marginTop: 8, paddingBottom: 16 },
  applyBtn: {
    backgroundColor: "#bda632",
    height: 48,
    borderRadius: 47,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    ...type.callout,
    fontWeight: "500",
    color: "#fbf9f0",
  },
  clearBtn: {
    height: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    ...type.callout,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
});
