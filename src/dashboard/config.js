export const CSV_URL = "./data.csv";

export const THEME_VARS = {
  dark: {
    bg: "#0a0c10",
    surface: "#111318",
    surfaceAlt: "#151923",
    border: "#1e2230",
    borderHover: "#2e3450",
    accent: "#6c63ff",
    accentSoft: "rgba(108, 99, 255, 0.14)",
    accentGlow: "rgba(108, 99, 255, 0.36)",
    positive: "#22d3a0",
    positiveSoft: "rgba(34, 211, 160, 0.12)",
    neutral: "#f59e0b",
    neutralSoft: "rgba(245, 158, 11, 0.12)",
    negative: "#f43f5e",
    negativeSoft: "rgba(244, 63, 94, 0.12)",
    watch: "#fb923c",
    escalate: "#ef4444",
    followUp: "#a78bfa",
    text: "#e2e8f0",
    muted: "#64748b",
    dim: "#334155",
    onAccent: "#f8fafc",
    shadow: "rgba(2, 6, 23, 0.46)",
  },
  light: {
    bg: "#f5f7fb",
    surface: "#ffffff",
    surfaceAlt: "#f8faff",
    border: "#dbe4f2",
    borderHover: "#b7c6de",
    accent: "#4f46e5",
    accentSoft: "rgba(79, 70, 229, 0.12)",
    accentGlow: "rgba(79, 70, 229, 0.24)",
    positive: "#0d9488",
    positiveSoft: "rgba(13, 148, 136, 0.12)",
    neutral: "#d97706",
    neutralSoft: "rgba(217, 119, 6, 0.12)",
    negative: "#e11d48",
    negativeSoft: "rgba(225, 29, 72, 0.12)",
    watch: "#ea580c",
    escalate: "#dc2626",
    followUp: "#7c3aed",
    text: "#0f172a",
    muted: "#475569",
    dim: "#94a3b8",
    onAccent: "#ffffff",
    shadow: "rgba(15, 23, 42, 0.12)",
  },
};

export const C = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  surfaceAlt: "var(--surface-alt)",
  border: "var(--border)",
  borderHover: "var(--border-hover)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  accentGlow: "var(--accent-glow)",
  positive: "var(--positive)",
  positiveSoft: "var(--positive-soft)",
  neutral: "var(--neutral)",
  neutralSoft: "var(--neutral-soft)",
  negative: "var(--negative)",
  negativeSoft: "var(--negative-soft)",
  watch: "var(--watch)",
  escalate: "var(--escalate)",
  followUp: "var(--follow-up)",
  text: "var(--text)",
  textMuted: "var(--muted)",
  textDim: "var(--dim)",
  onAccent: "var(--on-accent)",
  shadow: "var(--shadow)",
};

export const SENTIMENT_COLORS = {
  positive: C.positive,
  neutral: C.neutral,
  negative: C.negative,
  unknown: C.textDim,
};

export const ACTION_COLORS = {
  watch: C.watch,
  follow_up: C.followUp,
  escalate: C.escalate,
  ignore: C.textDim,
  unknown: C.textDim,
};

export const THEME_LABELS = {
  communication: "Iletisim",
  culture: "Kultur",
  process: "Surec",
  learning_development: "Gelisim",
  tools_systems: "Araclar",
  team_dynamics: "Takim",
  fairness: "Adalet",
  manager_behavior: "Yonetici",
  compensation: "Ucret",
  workload: "Is Yuku",
};

export const TREND_LABELS = {
  daily: "Gunluk",
  weekly: "Haftalik",
};

export const SENTIMENT_LABELS = {
  positive: "Pozitif",
  neutral: "Notr",
  negative: "Negatif",
  unknown: "Belirsiz",
};

export const ACTION_LABELS = {
  watch: "Watch",
  follow_up: "Follow Up",
  escalate: "Escalate",
  ignore: "Ignore",
  unknown: "Unknown",
};

export const ACTION_PRIORITY_WEIGHT = {
  escalate: 1,
  follow_up: 0.8,
  watch: 0.55,
  ignore: 0.1,
  unknown: 0.25,
};

export const FOCUS_MODES = {
  all: "Tum Kayitlar",
  critical: "Kritik",
  negative: "Negatif",
  low_confidence: "Dusuk Guven",
};
