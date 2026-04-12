import { Horse, Stall, HealthScore, Alert, Annotation, FarmSettings } from "./types";

export const horses: Horse[] = [
  { id: "h1", name: "Thunder", breed: "Thoroughbred", age: 8, stallId: "s1", imageUrl: "" },
  { id: "h2", name: "Bella", breed: "Quarter Horse", age: 5, stallId: "s2", imageUrl: "" },
  { id: "h3", name: "Shadow", breed: "Arabian", age: 12, stallId: "s3", imageUrl: "" },
  { id: "h4", name: "Maple", breed: "Paint Horse", age: 6, stallId: "s4", imageUrl: "" },
  { id: "h5", name: "Duke", breed: "Warmblood", age: 10, stallId: "s5", imageUrl: "" },
  { id: "h6", name: "Rosie", breed: "Appaloosa", age: 4, stallId: "s6", imageUrl: "" },
  { id: "h7", name: "Storm", breed: "Friesian", age: 7, stallId: "s7", imageUrl: "" },
  { id: "h8", name: "Clover", breed: "Morgan", age: 9, stallId: "s8", imageUrl: "" },
];

export const stalls: Stall[] = [
  { id: "s1", name: "Stall A1", horseId: "h1", cameraStatus: "online" },
  { id: "s2", name: "Stall A2", horseId: "h2", cameraStatus: "online" },
  { id: "s3", name: "Stall A3", horseId: "h3", cameraStatus: "online" },
  { id: "s4", name: "Stall B1", horseId: "h4", cameraStatus: "online" },
  { id: "s5", name: "Stall B2", horseId: "h5", cameraStatus: "online" },
  { id: "s6", name: "Stall B3", horseId: "h6", cameraStatus: "offline" },
  { id: "s7", name: "Stall C1", horseId: "h7", cameraStatus: "online" },
  { id: "s8", name: "Stall C2", horseId: "h8", cameraStatus: "online" },
];

const NOW = "2026-04-12T12:00:00.000Z";
function timeAgo(minutes: number): string {
  return new Date(new Date(NOW).getTime() - minutes * 60000).toISOString();
}

export const initialScores: Record<string, HealthScore> = {
  s1: { stallId: "s1", timestamp: NOW, overall: 14, movement: 12, posture: 16, feeding: 15, activity: 13, status: "healthy" },
  s2: { stallId: "s2", timestamp: NOW, overall: 21, movement: 19, posture: 24, feeding: 22, activity: 18, status: "healthy" },
  s3: { stallId: "s3", timestamp: NOW, overall: 68, movement: 72, posture: 65, feeding: 70, activity: 58, status: "at-risk" },
  s4: { stallId: "s4", timestamp: NOW, overall: 11, movement: 10, posture: 13, feeding: 12, activity: 9, status: "healthy" },
  s5: { stallId: "s5", timestamp: NOW, overall: 44, movement: 48, posture: 42, feeding: 40, activity: 46, status: "watch" },
  s6: { stallId: "s6", timestamp: NOW, overall: 17, movement: 15, posture: 20, feeding: 18, activity: 14, status: "healthy" },
  s7: { stallId: "s7", timestamp: NOW, overall: 85, movement: 88, posture: 82, feeding: 86, activity: 80, status: "critical" },
  s8: { stallId: "s8", timestamp: NOW, overall: 19, movement: 18, posture: 22, feeding: 20, activity: 16, status: "healthy" },
};

export const timelines: Record<string, number[]> = {
  s1: [14,15,13,14,16,15,14,13,15,14,12,13,14,15,16,14,13,15,14,12,14,15,13,14,16,15,14,13,12,14,15,13,14,16,15,14,13,12,14,15,13,14,16,15,14,13,12,14],
  s2: [22,21,23,22,20,21,23,24,22,21,20,22,23,21,20,22,24,23,21,20,22,23,21,20,22,24,23,21,20,22,23,21,20,22,24,23,21,20,22,23,21,20,22,24,23,21,20,22],
  s3: [42,44,48,52,55,58,60,63,65,68,70,72,68,65,62,58,55,58,62,65,68,70,72,68,65,62,58,55,52,55,58,62,65,68,70,72,68,65,62,58,55,58,62,65,68,70,72,68],
  s4: [12,11,13,12,10,11,13,14,12,11,10,12,13,11,10,12,14,13,11,10,12,13,11,10,12,14,13,11,10,12,13,11,10,12,14,13,11,10,12,13,11,10,12,14,13,11,10,12],
  s5: [38,40,42,44,46,48,45,42,40,38,36,38,40,42,44,46,48,45,42,40,38,36,38,40,42,44,46,48,45,42,40,38,36,38,40,42,44,46,48,45,42,40,38,36,38,40,42,44],
  s6: [18,17,19,18,16,17,19,20,18,17,16,18,19,17,16,18,20,19,17,16,18,19,17,16,18,20,19,17,16,18,19,17,16,18,20,19,17,16,18,19,17,16,18,20,19,17,16,18],
  s7: [55,58,62,65,70,74,78,80,82,85,88,85,82,80,78,80,82,85,88,90,88,85,82,80,78,80,82,85,88,85,82,80,78,80,82,85,88,90,88,85,82,80,78,80,82,85,88,85],
  s8: [20,19,21,20,18,19,21,22,20,19,18,20,21,19,18,20,22,21,19,18,20,21,19,18,20,22,21,19,18,20,21,19,18,20,22,21,19,18,20,21,19,18,20,22,21,19,18,20],
};

export const initialAlerts: Alert[] = [
  { id: "a1", stallId: "s3", horseId: "h3", timestamp: timeAgo(45), severity: "warning", message: "Shadow's risk score elevated to 68. Multiple behavioral changes detected.", status: "new" },
  { id: "a2", stallId: "s7", horseId: "h7", timestamp: timeAgo(20), severity: "critical", message: "Storm's risk score critical at 85. Immediate attention required.", status: "new" },
  { id: "a3", stallId: "s5", horseId: "h5", timestamp: timeAgo(180), severity: "warning", message: "Duke showed elevated movement patterns. Score reached 62.", status: "resolved", acknowledgedAt: timeAgo(170), resolvedAt: timeAgo(120), note: "Checked on Duke, was just restless after feeding change." },
];

export const annotations: Record<string, Annotation[]> = {
  s1: [
    { id: "an1", stallId: "s1", timestamp: timeAgo(30), type: "activity", message: "Normal grazing pattern resumed", severity: "info" },
    { id: "an2", stallId: "s1", timestamp: timeAgo(120), type: "feeding", message: "Water intake normal", severity: "info" },
  ],
  s2: [
    { id: "an3", stallId: "s2", timestamp: timeAgo(60), type: "movement", message: "Mild pacing observed, settled after 10 minutes", severity: "info" },
  ],
  s3: [
    { id: "an4", stallId: "s3", timestamp: timeAgo(10), type: "movement", message: "Pawing detected at 02:14 AM", severity: "warning" },
    { id: "an5", stallId: "s3", timestamp: timeAgo(25), type: "posture", message: "Lying down for 45+ minutes (unusual)", severity: "warning" },
    { id: "an6", stallId: "s3", timestamp: timeAgo(40), type: "feeding", message: "No water intake in last 3 hours", severity: "warning" },
    { id: "an7", stallId: "s3", timestamp: timeAgo(90), type: "activity", message: "Decreased movement last 2 hours", severity: "info" },
  ],
  s4: [
    { id: "an8", stallId: "s4", timestamp: timeAgo(45), type: "feeding", message: "Normal feeding pattern", severity: "info" },
  ],
  s5: [
    { id: "an9", stallId: "s5", timestamp: timeAgo(15), type: "movement", message: "Brief rolling episode observed", severity: "info" },
    { id: "an10", stallId: "s5", timestamp: timeAgo(60), type: "posture", message: "Stretching observed, returned to normal stance", severity: "info" },
  ],
  s6: [
    { id: "an11", stallId: "s6", timestamp: timeAgo(120), type: "activity", message: "Camera offline — last reading normal", severity: "info" },
  ],
  s7: [
    { id: "an12", stallId: "s7", timestamp: timeAgo(5), type: "movement", message: "Rolling observed at 11:30 PM", severity: "critical" },
    { id: "an13", stallId: "s7", timestamp: timeAgo(15), type: "posture", message: "Frequent lying down and getting up", severity: "critical" },
    { id: "an14", stallId: "s7", timestamp: timeAgo(30), type: "feeding", message: "No food or water intake in last 4 hours", severity: "warning" },
    { id: "an15", stallId: "s7", timestamp: timeAgo(45), type: "movement", message: "Persistent pawing at ground", severity: "warning" },
    { id: "an16", stallId: "s7", timestamp: timeAgo(60), type: "activity", message: "Restless behavior increasing", severity: "info" },
  ],
  s8: [
    { id: "an17", stallId: "s8", timestamp: timeAgo(90), type: "activity", message: "Normal resting pattern", severity: "info" },
  ],
};

export const defaultSettings: FarmSettings = {
  farmName: "Green Valley Equestrian",
  ownerName: "Sarah Mitchell",
  phone: "(555) 234-5678",
  email: "user@farm.com",
  vetPhone: "(555) 987-6543",
  alertNotifications: true,
  alertSound: false,
  paranoiaLevel: 3,
};
