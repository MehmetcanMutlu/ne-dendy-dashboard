import { THEME_VARS } from "./config";

export function toThemeVars(mode) {
  const values = THEME_VARS[mode] || THEME_VARS.dark;
  return {
    "--bg": values.bg,
    "--surface": values.surface,
    "--surface-alt": values.surfaceAlt,
    "--border": values.border,
    "--border-hover": values.borderHover,
    "--accent": values.accent,
    "--accent-soft": values.accentSoft,
    "--accent-glow": values.accentGlow,
    "--positive": values.positive,
    "--positive-soft": values.positiveSoft,
    "--neutral": values.neutral,
    "--neutral-soft": values.neutralSoft,
    "--negative": values.negative,
    "--negative-soft": values.negativeSoft,
    "--watch": values.watch,
    "--escalate": values.escalate,
    "--follow-up": values.followUp,
    "--text": values.text,
    "--muted": values.muted,
    "--dim": values.dim,
    "--on-accent": values.onAccent,
    "--shadow": values.shadow,
  };
}

export function parseJSONValue(input, fallback = []) {
  if (!input) return fallback;
  if (Array.isArray(input)) return input;
  if (typeof input === "object") return input;
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

export function parseArray(input) {
  const parsed = parseJSONValue(input, []);
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  return [];
}

export function parseObject(input) {
  const parsed = parseJSONValue(input, {});
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
  return {};
}

export function toNumber(value, fallback = 0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "true" || normalized === "t" || normalized === "1" || normalized === "yes";
}

export function normalizeSentiment(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "positive" || normalized === "neutral" || normalized === "negative") {
    return normalized;
  }
  return "unknown";
}

export function normalizeAction(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "watch" || normalized === "follow_up" || normalized === "escalate" || normalized === "ignore") {
    return normalized;
  }
  return "unknown";
}

export function parseDateValue(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const withT = trimmed.replace(" ", "T");
  const withZone = withT.replace(/\+00$/, "Z");
  const microToMilli = withZone.replace(/\.(\d{3})\d+/, ".$1");
  const d = new Date(microToMilli);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatSurveyId(id) {
  return String(id || "").slice(-6);
}

export function formatPct(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

export function formatDateTime(dateValue) {
  if (!dateValue) return "-";
  return dateValue.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateKey(dateValue) {
  return dateValue.toISOString().slice(0, 10);
}

export function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function startOfWeek(dateValue) {
  const d = new Date(Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
}

export function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function downloadCsv(filename, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  const csv = lines.join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
