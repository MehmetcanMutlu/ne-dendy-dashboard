import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  Legend,
} from "recharts";

const CSV_URL = "./data.csv";

const THEME_VARS = {
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

const C = {
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

const SENTIMENT_COLORS = {
  positive: C.positive,
  neutral: C.neutral,
  negative: C.negative,
  unknown: C.textDim,
};

const ACTION_COLORS = {
  watch: C.watch,
  follow_up: C.followUp,
  escalate: C.escalate,
  ignore: C.textDim,
  unknown: C.textDim,
};

const THEME_LABELS = {
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

const TREND_LABELS = {
  daily: "Gunluk",
  weekly: "Haftalik",
};

const SENTIMENT_LABELS = {
  positive: "Pozitif",
  neutral: "Notr",
  negative: "Negatif",
  unknown: "Belirsiz",
};

const ACTION_LABELS = {
  watch: "Watch",
  follow_up: "Follow Up",
  escalate: "Escalate",
  ignore: "Ignore",
  unknown: "Unknown",
};

const ACTION_PRIORITY_WEIGHT = {
  escalate: 1,
  follow_up: 0.8,
  watch: 0.55,
  ignore: 0.1,
  unknown: 0.25,
};

const FOCUS_MODES = {
  all: "Tum Kayitlar",
  critical: "Kritik",
  negative: "Negatif",
  low_confidence: "Dusuk Guven",
};

function toThemeVars(mode) {
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

function parseJSONValue(input, fallback = []) {
  if (!input) return fallback;
  if (Array.isArray(input)) return input;
  if (typeof input === "object") return input;
  try {
    const parsed = JSON.parse(input);
    return parsed;
  } catch {
    return fallback;
  }
}

function parseArray(input) {
  const parsed = parseJSONValue(input, []);
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  return [];
}

function parseObject(input) {
  const parsed = parseJSONValue(input, {});
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
  return {};
}

function toNumber(value, fallback = 0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "true" || normalized === "t" || normalized === "1" || normalized === "yes";
}

function normalizeSentiment(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "positive" || normalized === "neutral" || normalized === "negative") {
    return normalized;
  }
  return "unknown";
}

function normalizeAction(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "watch" || normalized === "follow_up" || normalized === "escalate" || normalized === "ignore") {
    return normalized;
  }
  return "unknown";
}

function parseDateValue(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const withT = trimmed.replace(" ", "T");
  const withZone = withT.replace(/\+00$/, "Z");
  const microToMilli = withZone.replace(/\.(\d{3})\d+/, ".$1");
  const d = new Date(microToMilli);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatSurveyId(id) {
  return String(id || "").slice(-6);
}

function formatPct(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";
  return dateValue.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateKey(dateValue) {
  return dateValue.toISOString().slice(0, 10);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function startOfWeek(dateValue) {
  const d = new Date(Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadCsv(filename, headers, rows) {
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

const Badge = ({ color, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      background: `${color}1a`,
      color,
      border: `1px solid ${color}4d`,
      lineHeight: 1.2,
    }}
  >
    {children}
  </span>
);

const Pill = ({ label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 10,
      background: `${color}18`,
      border: `1px solid ${color}4d`,
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
      }}
    />
    <span style={{ color: C.textMuted, fontSize: 12 }}>{label}</span>
    <span style={{ color, fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>{value}</span>
  </div>
);

const StatCard = ({ label, value, sub, accent, icon }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "20px 20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 6px 24px ${C.shadow}`,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 84,
        height: 84,
        borderRadius: "0 16px 0 84px",
        background: `${accent || C.accent}14`,
      }}
    />
    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
    <div
      style={{
        fontSize: 30,
        lineHeight: 1,
        fontWeight: 800,
        fontFamily: "'DM Mono', monospace",
        color: accent || C.text,
      }}
    >
      {value}
    </div>
    <div style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>{label}</div>
    {sub ? <div style={{ color: C.textDim, fontSize: 11, marginTop: 3 }}>{sub}</div> : null}
  </div>
);

const ScoreBar = ({ value }) => {
  const pct = Math.round((toNumber(value) || 0) * 100);
  const color = pct >= 70 ? C.positive : pct >= 40 ? C.neutral : C.negative;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 64,
          height: 5,
          borderRadius: 3,
          background: C.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.35s ease",
          }}
        />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.surfaceAlt,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: `0 10px 32px ${C.shadow}`,
      }}
    >
      {label ? (
        <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 6, fontWeight: 700 }}>{label}</div>
      ) : null}
      {payload.map((entry, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color || entry.fill }} />
          <span style={{ color: C.textMuted, fontSize: 12 }}>{entry.name}:</span>
          <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

function InsightCard({ item, index, onParticipantClick }) {
  const actionColor = ACTION_COLORS[item.action] || C.textDim;
  const sentimentColor = SENTIMENT_COLORS[item.sentiment] || C.textDim;

  return (
    <article
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${actionColor}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        animation: `fadeUp 260ms ease both`,
        animationDelay: `${index * 28}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, lineHeight: 1.45 }}>
            {item.display_label || item.summary || "-"}
          </div>
          {item.display_note ? (
            <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4, fontStyle: "italic", lineHeight: 1.5 }}>
              "{item.display_note}"
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <Badge color={actionColor}>{ACTION_LABELS[item.action] || item.action}</Badge>
          <Badge color={sentimentColor}>{SENTIMENT_LABELS[item.sentiment] || item.sentiment}</Badge>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <ScoreBar value={item.score} />
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>
          Oncelik {Math.round(item.priorityScore * 100)}%
        </span>
        {item.themes.slice(0, 3).map((theme) => (
          <span
            key={`${item.label_id}-${theme}`}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 8,
              border: `1px solid ${C.accentGlow}`,
              background: C.accentSoft,
              color: C.accent,
              fontWeight: 700,
            }}
          >
            {THEME_LABELS[theme] || theme}
          </span>
        ))}

        <button
          type="button"
          onClick={() => onParticipantClick(item.participant_id)}
          style={{
            marginLeft: "auto",
            border: `1px solid ${C.border}`,
            background: C.surfaceAlt,
            color: C.textMuted,
            borderRadius: 8,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          #{item.participant_id} • Q{item.question_id}
        </button>
      </div>
    </article>
  );
}

function Section({ title, subtitle, color, items, onParticipantClick, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
          padding: "0 0 12px",
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        <div style={{ width: 3, height: 22, borderRadius: 2, background: color }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{subtitle}</div>
        </div>
        <Badge color={color}>{items.length}</Badge>
        <span
          style={{
            marginLeft: "auto",
            color: C.textMuted,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </button>

      {open ? (
        <div className="insight-grid">
          {items.map((item, index) => (
            <InsightCard
              key={`${item.label_id}-${index}`}
              item={item}
              index={index}
              onParticipantClick={onParticipantClick}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OverviewTab({
  stats,
  trendData,
  trendMode,
  onTrendModeChange,
  focusMode,
  onFocusModeChange,
  topParticipants,
  dataQuality,
  onParticipantClick,
}) {
  const { total, avgScore, avgPriority, sentCounts, actionCounts, topThemes, urgentCount, riskScore, sentPie, actionBar } = stats;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="panel" style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Focus Mode
          </span>
          {Object.entries(FOCUS_MODES).map(([mode, label]) => (
            <button
              type="button"
              key={mode}
              onClick={() => onFocusModeChange(mode)}
              className="chip-btn"
              style={{
                borderColor: focusMode === mode ? C.accent : C.border,
                background: focusMode === mode ? C.accentSoft : "transparent",
                color: focusMode === mode ? C.accent : C.textMuted,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        <StatCard label="Toplam Yanit" value={total.toLocaleString()} icon="📋" accent={C.accent} />
        <StatCard
          label="Ort. Skor"
          value={formatPct(avgScore * 100)}
          sub="Tum yanitlar"
          icon="📈"
          accent={avgScore > 0.6 ? C.positive : avgScore > 0.4 ? C.neutral : C.negative}
        />
        <StatCard
          label="Pozitif"
          value={(sentCounts.positive || 0).toLocaleString()}
          sub={`${total ? Math.round(((sentCounts.positive || 0) / total) * 100) : 0}% pay`}
          icon="✅"
          accent={C.positive}
        />
        <StatCard
          label="Aksiyonluk"
          value={urgentCount.toLocaleString()}
          sub="watch + follow_up + escalate"
          icon="⚠️"
          accent={C.watch}
        />
        <StatCard
          label="Risk Endeksi"
          value={formatPct(riskScore * 100)}
          sub="severity x confidence"
          icon="🧭"
          accent={riskScore > 0.45 ? C.escalate : riskScore > 0.3 ? C.watch : C.positive}
        />
        <StatCard
          label="Oncelik Skoru"
          value={formatPct(avgPriority * 100)}
          sub="severity + confidence + sentiment + action"
          icon="🎯"
          accent={avgPriority > 0.62 ? C.escalate : avgPriority > 0.45 ? C.watch : C.positive}
        />
      </div>

      <div className="chart-grid">
        <div className="panel">
          <div className="panel-title">Duygu Dagilimi</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={sentPie} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {sentPie.map((entry) => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {sentPie.map((entry) => (
                <Pill
                  key={entry.name}
                  label={SENTIMENT_LABELS[entry.name]}
                  value={entry.value}
                  color={SENTIMENT_COLORS[entry.name]}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Aksiyon Dagilimi</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={actionBar} margin={{ left: -10, right: 8 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Adet">
                {actionBar.map((entry) => (
                  <Cell key={entry.name} fill={ACTION_COLORS[entry.raw]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>
            Sentiment Trendi ({TREND_LABELS[trendMode]})
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {Object.keys(TREND_LABELS).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => onTrendModeChange(mode)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1px solid ${trendMode === mode ? C.accent : C.border}`,
                  background: trendMode === mode ? C.accentSoft : "transparent",
                  color: trendMode === mode ? C.accent : C.textMuted,
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {TREND_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {trendData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ left: 0, right: 10, top: 8 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: C.textMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="positive" name="Pozitif %" stroke={C.positive} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="neutral" name="Notr %" stroke={C.neutral} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="negative" name="Negatif %" stroke={C.negative} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-box">Trend olusturmak icin tarih verisi bulunamadi.</div>
        )}
      </div>

      {actionCounts.escalate > 0 ? (
        <div
          style={{
            background: `${C.escalate}12`,
            border: `1px solid ${C.escalate}4d`,
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: `${C.escalate}22`,
              fontSize: 17,
            }}
          >
            🚨
          </div>
          <div>
            <div style={{ color: C.escalate, fontWeight: 800, fontSize: 14 }}>
              {actionCounts.escalate} kayit escalate durumunda
            </div>
            <div style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>
              Bu kayitlar hizli inceleme gerektiriyor. Icgoruler sekmesinden katilimci detayina gec.
            </div>
          </div>
        </div>
      ) : null}

      <div className="panel">
        <div className="panel-title">On Plana Cikan Temalar</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {topThemes.slice(0, 8).map((theme) => (
            <div
              key={theme.name}
              style={{
                border: `1px solid ${C.border}`,
                background: C.surfaceAlt,
                color: C.text,
                borderRadius: 10,
                padding: "7px 10px",
                fontSize: 12,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span>{theme.name}</span>
              <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{theme.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-grid">
        <div className="panel">
          <div className="panel-title">En Riskli Katilimcilar</div>
          {topParticipants.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topParticipants.map((row) => (
                <button
                  type="button"
                  key={row.participantId}
                  onClick={() => onParticipantClick(row.participantId)}
                  className="participant-row"
                >
                  <span style={{ color: C.text, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>#{row.participantId}</span>
                  <span style={{ color: C.textMuted, fontSize: 11 }}>{row.total} yanit</span>
                  <span style={{ color: C.escalate, fontSize: 11, fontWeight: 700 }}>
                    {row.escalateCount ? `${row.escalateCount} escalate` : "escalate yok"}
                  </span>
                  <span style={{ marginLeft: "auto", color: C.accent, fontWeight: 800, fontSize: 12 }}>
                    {formatPct(row.avgPriority * 100)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-box" style={{ minHeight: 120 }}>
              Katilimci riski olusturulamadi.
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Veri Kalitesi</div>
          <div className="quality-grid">
            <Pill label="Tarih Eksik" value={dataQuality.missingDate} color={C.watch} />
            <Pill label="Sentiment Belirsiz" value={dataQuality.unknownSentiment} color={C.neutral} />
            <Pill label="Aksiyon Belirsiz" value={dataQuality.unknownAction} color={C.neutral} />
            <Pill label="Tema Eksik" value={dataQuality.missingTheme} color={C.watch} />
            <Pill label="Dusuk Guven (<70%)" value={dataQuality.lowConfidence} color={C.escalate} />
            <Pill label="Gorunmeyen Kayit" value={dataQuality.hiddenRows} color={C.textDim} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsTab({ data, onParticipantClick }) {
  const actionGroups = useMemo(() => {
    const groups = { escalate: [], follow_up: [], watch: [], ignore: [], unknown: [] };
    data.forEach((item) => {
      if (groups[item.action]) groups[item.action].push(item);
      else groups.unknown.push(item);
    });
    return groups;
  }, [data]);

  if (!data.length) {
    return (
      <div className="empty-box" style={{ minHeight: 220 }}>
        Filtrelerle eslesen sonuc bulunamadi.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {actionGroups.escalate.length ? (
        <Section
          title="🔴 Escalate"
          subtitle="Acil mudahale gerektiren kayitlar"
          color={C.escalate}
          items={actionGroups.escalate}
          onParticipantClick={onParticipantClick}
        />
      ) : null}
      {actionGroups.follow_up.length ? (
        <Section
          title="🟣 Follow Up"
          subtitle="Takip edilmesi gereken kayitlar"
          color={C.followUp}
          items={actionGroups.follow_up}
          onParticipantClick={onParticipantClick}
        />
      ) : null}
      {actionGroups.watch.length ? (
        <Section
          title="🟠 Watch"
          subtitle="Yakindan izlenmesi gereken kayitlar"
          color={C.watch}
          items={actionGroups.watch}
          onParticipantClick={onParticipantClick}
        />
      ) : null}
      {actionGroups.ignore.length ? (
        <Section
          title="⚫ Ignore"
          subtitle="Aksiyon gerektirmeyen kayitlar"
          color={C.textDim}
          items={actionGroups.ignore}
          onParticipantClick={onParticipantClick}
          collapsed
        />
      ) : null}
    </div>
  );
}

function MiniBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 54, color: C.textMuted, fontSize: 11, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, overflow: "hidden", background: C.border }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span style={{ minWidth: 30, textAlign: "right", color, fontWeight: 700, fontSize: 11 }}>{value}</span>
    </div>
  );
}

function ThemesTab({ stats, filteredData }) {
  const { topThemes } = stats;

  const themeDetails = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      row.themes.forEach((theme) => {
        if (!map[theme]) {
          map[theme] = { positive: 0, neutral: 0, negative: 0, total: 0, scores: [] };
        }
        if (row.sentiment === "positive") map[theme].positive += 1;
        if (row.sentiment === "neutral") map[theme].neutral += 1;
        if (row.sentiment === "negative") map[theme].negative += 1;
        map[theme].total += 1;
        if (row.score > 0) map[theme].scores.push(row.score);
      });
    });
    return map;
  }, [filteredData]);

  const radarData = topThemes.map((item) => ({ theme: item.name, count: item.count }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="chart-grid">
        <div className="panel">
          <div className="panel-title">Tema Radar</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="theme" tick={{ fill: C.textMuted, fontSize: 10 }} />
              <Radar dataKey="count" name="Frekans" fill={C.accent} fillOpacity={0.22} stroke={C.accent} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-title">En Sik Temalar</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topThemes} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: C.textMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={C.accent} radius={[0, 6, 6, 0]} name="Adet" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="theme-grid">
        {Object.entries(themeDetails)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([themeKey, value]) => {
            const themeName = THEME_LABELS[themeKey] || themeKey;
            const avgScore = value.scores.length
              ? value.scores.reduce((sum, score) => sum + score, 0) / value.scores.length
              : 0;
            const positiveRate = value.total ? (value.positive / value.total) * 100 : 0;

            return (
              <article key={themeKey} className="theme-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{themeName}</div>
                  <div style={{ color: C.accent, fontWeight: 800, fontFamily: "'DM Mono', monospace", fontSize: 20 }}>
                    {value.total}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <MiniBar label="Pozitif" value={value.positive} total={value.total} color={C.positive} />
                  <MiniBar label="Notr" value={value.neutral} total={value.total} color={C.neutral} />
                  <MiniBar label="Negatif" value={value.negative} total={value.total} color={C.negative} />
                </div>

                <div
                  style={{
                    marginTop: 10,
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    color: C.textMuted,
                    fontSize: 11,
                  }}
                >
                  <span>
                    Ort. Skor: <b style={{ color: C.text }}>{Math.round(avgScore * 100)}%</b>
                  </span>
                  <span>
                    Pozitif: <b style={{ color: C.positive }}>{Math.round(positiveRate)}%</b>
                  </span>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}

function ParticipantDrawer({ participantId, rows, onClose }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Participant Drill-down
            </div>
            <div style={{ fontSize: 18, color: C.text, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
              #{participantId}
            </div>
          </div>
          <button type="button" onClick={onClose} className="ghost-btn">
            Kapat
          </button>
        </div>

        <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>{rows.length} yanit bulundu</div>

        <div className="drawer-list">
          {rows.map((row, index) => (
            <article key={`${row.label_id}-${index}`} className="drawer-item">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Badge color={ACTION_COLORS[row.action] || C.textDim}>{ACTION_LABELS[row.action] || row.action}</Badge>
                <Badge color={SENTIMENT_COLORS[row.sentiment] || C.textDim}>
                  {SENTIMENT_LABELS[row.sentiment] || row.sentiment}
                </Badge>
                <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: 11 }}>Q{row.question_id}</span>
              </div>

              <div style={{ color: C.text, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
                {row.display_label || row.summary || "-"}
              </div>
              {row.display_note ? (
                <div style={{ color: C.textMuted, fontSize: 12, marginTop: 5, lineHeight: 1.5 }}>{row.display_note}</div>
              ) : null}

              <div style={{ display: "flex", gap: 12, marginTop: 10, color: C.textMuted, fontSize: 11, flexWrap: "wrap" }}>
                <span>Skor: <b style={{ color: C.text }}>{Math.round(row.score * 100)}%</b></span>
                <span>Severity: <b style={{ color: C.text }}>{Math.round(row.severity * 100)}%</b></span>
                <span>Confidence: <b style={{ color: C.text }}>{Math.round(row.confidence * 100)}%</b></span>
                <span>Oncelik: <b style={{ color: C.accent }}>{Math.round(row.priorityScore * 100)}%</b></span>
                <span>{formatDateTime(row.evaluatedDate)}</span>
              </div>

              {row.themes.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {row.themes.map((theme) => (
                    <span key={`${row.label_id}-${theme}`} className="theme-chip">
                      {THEME_LABELS[theme] || theme}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function NeDendy() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSurvey, setSelectedSurvey] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState("severity");
  const [focusMode, setFocusMode] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const searchInputRef = useRef(null);

  const [theme, setTheme] = useState(() => localStorage.getItem("ne-dendy-theme") || "dark");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [trendMode, setTrendMode] = useState("daily");
  const [activeParticipant, setActiveParticipant] = useState(null);

  useEffect(() => {
    localStorage.setItem("ne-dendy-theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileFiltersOpen(false);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.background = THEME_VARS[theme]?.bg || THEME_VARS.dark.bg;
  }, [theme]);

  useEffect(() => {
    if (!activeParticipant) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeParticipant]);

  useEffect(() => {
    function handleKey(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.altKey && event.key === "1") setActiveTab("overview");
      if (event.altKey && event.key === "2") setActiveTab("insights");
      if (event.altKey && event.key === "3") setActiveTab("themes");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const parsedRows = data.map((row) => {
            const payload = parseObject(row.label_payload);
            const rowThemes = parseArray(row.themes);
            const payloadThemes = parseArray(payload.themes);
            const rowRiskFlags = parseArray(row.risk_flags);
            const payloadRiskFlags = parseArray(payload.risk_flags);
            const themes = rowThemes.length ? rowThemes : payloadThemes;

            const normalizedAction = normalizeAction(row.action || payload.action);
            const normalizedSentiment = normalizeSentiment(row.sentiment);
            const evaluatedDate = parseDateValue(row.evaluated_at || row.labeled_at || row.created_at);
            const scoreValue = toNumber(row.score);
            const severityValue = toNumber(row.severity, toNumber(payload.severity));
            const confidenceValue = toNumber(row.confidence, toNumber(payload.confidence));

            const sentimentPenalty = normalizedSentiment === "negative" ? 0.25 : normalizedSentiment === "neutral" ? 0.12 : 0.02;
            const actionWeight = ACTION_PRIORITY_WEIGHT[normalizedAction] ?? ACTION_PRIORITY_WEIGHT.unknown;
            const priorityScore = clamp01(
              severityValue * 0.42 +
                (1 - scoreValue) * 0.24 +
                confidenceValue * 0.18 +
                sentimentPenalty * 0.1 +
                actionWeight * 0.16,
            );

            return {
              ...row,
              score: scoreValue,
              severity: severityValue,
              confidence: confidenceValue,
              priorityScore,
              action: normalizedAction,
              sentiment: normalizedSentiment,
              themes,
              risk_flags: rowRiskFlags.length ? rowRiskFlags : payloadRiskFlags,
              tags: parseArray(row.tags),
              should_display: toBool(row.should_display) || toBool(payload.should_display),
              display_label: (row.display_label || payload.display_label || "").trim(),
              display_note: (row.display_note || payload.display_note || "").trim(),
              summary: (row.summary || "").trim(),
              participant_id: String(row.participant_id || ""),
              question_id: String(row.question_id || ""),
              survey_id: String(row.survey_id || ""),
              evaluatedDate,
              evaluatedKey: evaluatedDate ? formatDateKey(evaluatedDate) : "",
            };
          });

          setAllData(parsedRows);
          setLoading(false);
        } catch {
          setError("Veri parse edilirken hata olustu.");
          setLoading(false);
        }
      },
      error: () => {
        setError("CSV dosyasi yuklenemedi.");
        setLoading(false);
      },
    });
  }, []);

  const surveyIds = useMemo(() => {
    return [...new Set(allData.map((row) => row.survey_id).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allData]);

  const filteredData = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return allData.filter((row) => {
      if (selectedSurvey !== "all" && row.survey_id !== selectedSurvey) return false;
      if (actionFilter !== "all" && row.action !== actionFilter) return false;
      if (sentimentFilter !== "all" && row.sentiment !== sentimentFilter) return false;
      if (focusMode === "critical" && !(row.priorityScore >= 0.68 || row.action === "escalate")) return false;
      if (focusMode === "negative" && row.sentiment !== "negative") return false;
      if (focusMode === "low_confidence" && row.confidence >= 0.7) return false;
      if (!query) return true;

      const text = `${row.display_label} ${row.display_note} ${row.summary} ${row.participant_id} ${row.themes.join(" ")} ${row.action} ${row.sentiment}`.toLowerCase();
      return text.includes(query);
    });
  }, [allData, selectedSurvey, actionFilter, sentimentFilter, deferredSearchQuery, focusMode]);

  const displayData = useMemo(() => {
    const list = filteredData
      .filter((row) => row.should_display || row.action !== "ignore")
      .slice();

    list.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "confidence") return b.confidence - a.confidence;
      if (sortBy === "priority") return b.priorityScore - a.priorityScore;
      return b.severity - a.severity;
    });

    return list;
  }, [filteredData, sortBy]);

  const stats = useMemo(() => {
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0, unknown: 0 };
    const actionCounts = { watch: 0, follow_up: 0, escalate: 0, ignore: 0, unknown: 0 };
    const themeMap = {};

    let scoreSum = 0;
    let scoreCount = 0;
    let prioritySum = 0;
    let priorityCount = 0;
    let riskAccumulator = 0;
    let riskCount = 0;

    filteredData.forEach((row) => {
      sentimentCounts[row.sentiment] = (sentimentCounts[row.sentiment] || 0) + 1;
      actionCounts[row.action] = (actionCounts[row.action] || 0) + 1;

      if (row.score > 0) {
        scoreSum += row.score;
        scoreCount += 1;
      }
      prioritySum += row.priorityScore;
      priorityCount += 1;

      if (row.action !== "ignore") {
        riskAccumulator += row.severity * row.confidence;
        riskCount += 1;
      }

      row.themes.forEach((theme) => {
        themeMap[theme] = (themeMap[theme] || 0) + 1;
      });
    });

    const topThemes = Object.entries(themeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ name: THEME_LABELS[theme] || theme, count }));

    const sentPie = ["positive", "neutral", "negative"].map((key) => ({
      name: key,
      value: sentimentCounts[key] || 0,
    }));

    const actionBar = ["escalate", "follow_up", "watch", "ignore"].map((key) => ({
      name: ACTION_LABELS[key],
      raw: key,
      value: actionCounts[key] || 0,
    }));

    return {
      total: filteredData.length,
      avgScore: scoreCount ? scoreSum / scoreCount : 0,
      avgPriority: priorityCount ? prioritySum / priorityCount : 0,
      sentCounts: sentimentCounts,
      actionCounts,
      sentPie,
      actionBar,
      topThemes,
      urgentCount: (actionCounts.watch || 0) + (actionCounts.follow_up || 0) + (actionCounts.escalate || 0),
      riskScore: riskCount ? riskAccumulator / riskCount : 0,
    };
  }, [filteredData]);

  const trendData = useMemo(() => {
    const bucketMap = new Map();

    filteredData.forEach((row) => {
      if (!row.evaluatedDate) return;
      let keyDate = row.evaluatedDate;
      if (trendMode === "weekly") keyDate = startOfWeek(row.evaluatedDate);

      const key = formatDateKey(keyDate);
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          key,
          date: keyDate,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0,
        });
      }

      const bucket = bucketMap.get(key);
      if (row.sentiment === "positive") bucket.positive += 1;
      if (row.sentiment === "neutral") bucket.neutral += 1;
      if (row.sentiment === "negative") bucket.negative += 1;
      bucket.total += 1;
    });

    return [...bucketMap.values()]
      .sort((a, b) => a.date - b.date)
      .map((bucket) => ({
        label: bucket.key,
        positive: bucket.total ? Math.round((bucket.positive / bucket.total) * 100) : 0,
        neutral: bucket.total ? Math.round((bucket.neutral / bucket.total) * 100) : 0,
        negative: bucket.total ? Math.round((bucket.negative / bucket.total) * 100) : 0,
      }));
  }, [filteredData, trendMode]);

  const topParticipants = useMemo(() => {
    const byParticipant = new Map();
    filteredData.forEach((row) => {
      if (!row.participant_id) return;
      if (!byParticipant.has(row.participant_id)) {
        byParticipant.set(row.participant_id, {
          participantId: row.participant_id,
          total: 0,
          escalateCount: 0,
          prioritySum: 0,
        });
      }
      const participant = byParticipant.get(row.participant_id);
      participant.total += 1;
      participant.prioritySum += row.priorityScore;
      if (row.action === "escalate") participant.escalateCount += 1;
    });

    return [...byParticipant.values()]
      .map((item) => ({
        ...item,
        avgPriority: item.total ? item.prioritySum / item.total : 0,
      }))
      .sort((a, b) => {
        if (b.avgPriority !== a.avgPriority) return b.avgPriority - a.avgPriority;
        return b.escalateCount - a.escalateCount;
      })
      .slice(0, 8);
  }, [filteredData]);

  const dataQuality = useMemo(() => {
    let missingDate = 0;
    let unknownSentiment = 0;
    let unknownAction = 0;
    let missingTheme = 0;
    let lowConfidence = 0;
    let hiddenRows = 0;

    filteredData.forEach((row) => {
      if (!row.evaluatedDate) missingDate += 1;
      if (row.sentiment === "unknown") unknownSentiment += 1;
      if (row.action === "unknown") unknownAction += 1;
      if (!row.themes.length) missingTheme += 1;
      if (row.confidence < 0.7) lowConfidence += 1;
      if (!row.should_display) hiddenRows += 1;
    });

    return { missingDate, unknownSentiment, unknownAction, missingTheme, lowConfidence, hiddenRows };
  }, [filteredData]);

  const participantRows = useMemo(() => {
    if (!activeParticipant) return [];
    return allData
      .filter((row) => row.participant_id === activeParticipant)
      .sort((a, b) => {
        const at = a.evaluatedDate ? a.evaluatedDate.getTime() : 0;
        const bt = b.evaluatedDate ? b.evaluatedDate.getTime() : 0;
        return bt - at;
      });
  }, [allData, activeParticipant]);

  function handleExport() {
    const rows = filteredData.map((row) => ({
      label_id: row.label_id,
      survey_id: row.survey_id,
      participant_id: row.participant_id,
      question_id: row.question_id,
      evaluated_at: row.evaluated_at,
      score: row.score,
      sentiment: row.sentiment,
      action: row.action,
      severity: row.severity,
      confidence: row.confidence,
      priority_score: row.priorityScore,
      themes: JSON.stringify(row.themes),
      display_label: row.display_label,
      display_note: row.display_note,
      summary: row.summary,
    }));

    const headers = [
      "label_id",
      "survey_id",
      "participant_id",
      "question_id",
      "evaluated_at",
      "score",
      "sentiment",
      "action",
      "severity",
      "confidence",
      "priority_score",
      "themes",
      "display_label",
      "display_note",
      "summary",
    ];

    const fileDate = new Date().toISOString().slice(0, 10);
    downloadCsv(`ne-dendy-filtered-${fileDate}.csv`, headers, rows);
  }

  function resetFilters() {
    setSelectedSurvey("all");
    setActionFilter("all");
    setSentimentFilter("all");
    setSearchQuery("");
    setFocusMode("all");
    setSortBy("severity");
  }

  if (loading) {
    return (
      <div style={{ ...toThemeVars(theme), minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div className="loader" />
          <div style={{ color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Veri yukleniyor...</div>
        </div>
        <DashboardStyle />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...toThemeVars(theme), minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg }}>
        <div className="empty-box">{error}</div>
        <DashboardStyle />
      </div>
    );
  }

  return (
    <div className="nd-app" style={{ ...toThemeVars(theme), background: C.bg, color: C.text }}>
      <DashboardStyle />

      <header className="nd-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="logo-badge">🔮</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>Ne Dendy?</div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.09em" }}>ANKET ICGORU DASHBOARD</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="header-badge">{allData.length.toLocaleString()} kayit</div>
          <div className="header-badge">{surveyIds.length} anket</div>
          <div className="header-badge">Focus: {FOCUS_MODES[focusMode]}</div>

          <button type="button" className="ghost-btn" onClick={handleExport}>
            Disa Aktar
          </button>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          {isMobile ? (
            <button type="button" className="ghost-btn" onClick={() => setMobileFiltersOpen((s) => !s)}>
              {mobileFiltersOpen ? "Kapat" : "Menu"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="nd-controls-wrap" style={{ display: isMobile && !mobileFiltersOpen ? "none" : "flex" }}>
        <div className="control-item">
          <label className="control-label">Anket</label>
          <select value={selectedSurvey} onChange={(event) => setSelectedSurvey(event.target.value)} className="control-input">
            <option value="all">Tum Anketler</option>
            {surveyIds.map((surveyId) => (
              <option key={surveyId} value={surveyId}>
                Anket #{formatSurveyId(surveyId)}
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label className="control-label">Aksiyon</label>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="control-input">
            <option value="all">Tum Aksiyonlar</option>
            <option value="escalate">Escalate</option>
            <option value="follow_up">Follow Up</option>
            <option value="watch">Watch</option>
            <option value="ignore">Ignore</option>
          </select>
        </div>

        <div className="control-item">
          <label className="control-label">Sentiment</label>
          <select value={sentimentFilter} onChange={(event) => setSentimentFilter(event.target.value)} className="control-input">
            <option value="all">Tum Duygular</option>
            <option value="positive">Pozitif</option>
            <option value="neutral">Notr</option>
            <option value="negative">Negatif</option>
          </select>
        </div>

        <div className="control-item">
          <label className="control-label">Focus Mode</label>
          <select value={focusMode} onChange={(event) => setFocusMode(event.target.value)} className="control-input">
            {Object.entries(FOCUS_MODES).map(([mode, label]) => (
              <option key={mode} value={mode}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-item control-search">
          <label className="control-label">Arama</label>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="control-input"
            placeholder="Etiket, not veya katilimci ara (Ctrl/Cmd+K)"
          />
        </div>

        <div className="control-item control-sort">
          <label className="control-label">Siralama</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["priority", "severity", "score", "confidence"].map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => setSortBy(key)}
                className="chip-btn"
                style={{
                  borderColor: sortBy === key ? C.accent : C.border,
                  color: sortBy === key ? C.accent : C.textMuted,
                  background: sortBy === key ? C.accentSoft : "transparent",
                }}
              >
                {key === "priority" ? "Oncelik" : key === "severity" ? "Onem" : key === "score" ? "Skor" : "Guven"}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="ghost-btn" onClick={resetFilters}>
          Filtreyi Temizle
        </button>
      </div>

      <div className="tabs-row">
        {[
          { id: "overview", label: "Genel Bakis", icon: "📊" },
          { id: "insights", label: "Icgoruler", icon: "💡" },
          { id: "themes", label: "Temalar", icon: "🗂️" },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="tab-btn"
            style={{
              borderBottomColor: activeTab === tab.id ? C.accent : "transparent",
              color: activeTab === tab.id ? C.accent : C.textMuted,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", color: C.textMuted, fontSize: 12 }}>{filteredData.length} sonuc</div>
      </div>

      <main className="main-content">
        {activeTab === "overview" ? (
          <OverviewTab
            stats={stats}
            trendData={trendData}
            trendMode={trendMode}
            onTrendModeChange={setTrendMode}
            focusMode={focusMode}
            onFocusModeChange={setFocusMode}
            topParticipants={topParticipants}
            dataQuality={dataQuality}
            onParticipantClick={(participantId) => setActiveParticipant(participantId)}
          />
        ) : null}

        {activeTab === "insights" ? (
          <InsightsTab data={displayData} onParticipantClick={(participantId) => setActiveParticipant(participantId)} />
        ) : null}

        {activeTab === "themes" ? <ThemesTab stats={stats} filteredData={filteredData} /> : null}
      </main>

      <footer className="nd-footer">
        <span>Ne Dendy Dashboard · v2.0</span>
        <span>
          {new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </footer>

      {activeParticipant ? (
        <ParticipantDrawer participantId={activeParticipant} rows={participantRows} onClose={() => setActiveParticipant(null)} />
      ) : null}
    </div>
  );
}

function DashboardStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');

      * {
        box-sizing: border-box;
      }

      .nd-app {
        min-height: 100vh;
        font-family: 'DM Sans', sans-serif;
        transition: background-color 220ms ease, color 220ms ease;
        position: relative;
        overflow-x: hidden;
      }

      .nd-app::before {
        content: "";
        position: fixed;
        inset: -20% -10% auto;
        height: 520px;
        pointer-events: none;
        z-index: 0;
        background:
          radial-gradient(circle at 14% 20%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 46%),
          radial-gradient(circle at 86% 8%, color-mix(in srgb, var(--positive) 20%, transparent) 0%, transparent 42%),
          radial-gradient(circle at 52% 48%, color-mix(in srgb, var(--neutral) 14%, transparent) 0%, transparent 58%);
      }

      .nd-header {
        height: 68px;
        padding: 0 24px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 30;
        backdrop-filter: blur(12px);
        background: color-mix(in srgb, var(--bg) 88%, transparent);
        z-index: 40;
      }

      .logo-badge {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, var(--accent), #8f75ff);
        box-shadow: 0 0 18px var(--accent-glow);
      }

      .header-badge {
        border: 1px solid var(--border);
        background: var(--surface-alt);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 11px;
        color: var(--muted);
        white-space: nowrap;
      }

      .nd-controls-wrap {
        border-bottom: 1px solid var(--border);
        padding: 14px 24px;
        display: flex;
        gap: 10px;
        align-items: flex-end;
        flex-wrap: wrap;
        background: var(--surface);
      }

      .control-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .control-search {
        flex: 1;
        min-width: 240px;
      }

      .control-sort {
        min-width: 180px;
      }

      .control-label {
        font-size: 11px;
        color: var(--muted);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .control-input {
        border: 1px solid var(--border);
        background: var(--bg);
        color: var(--text);
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 13px;
        font-family: 'DM Sans', sans-serif;
        outline: none;
      }

      .control-input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft);
      }

      .ghost-btn {
        border: 1px solid var(--border);
        background: var(--surface-alt);
        color: var(--text);
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
      }

      .ghost-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
      }

      .chip-btn {
        border: 1px solid var(--border);
        background: transparent;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      }

      .tabs-row {
        display: flex;
        align-items: center;
        gap: 4px;
        border-bottom: 1px solid var(--border);
        padding: 0 24px;
        background: var(--surface);
        overflow-x: auto;
      }

      .tab-btn {
        border: none;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: var(--muted);
        padding: 14px 14px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      }

      .main-content {
        max-width: 1400px;
        width: 100%;
        margin: 0 auto;
        padding: 24px;
        position: relative;
        z-index: 2;
      }

      .nd-footer {
        border-top: 1px solid var(--border);
        padding: 12px 24px;
        display: flex;
        justify-content: space-between;
        color: var(--dim);
        font-size: 11px;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }

      .chart-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }

      .insight-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
        gap: 10px;
      }

      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
        gap: 12px;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 28px var(--shadow);
        transition: transform 160ms ease, border-color 160ms ease;
      }

      .panel:hover {
        transform: translateY(-1px);
        border-color: var(--border-hover);
      }

      .panel-title {
        color: var(--text);
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 16px;
      }

      .theme-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px;
      }

      .theme-card:hover {
        border-color: var(--accent);
      }

      .quality-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .participant-row {
        border: 1px solid var(--border);
        background: var(--surface-alt);
        border-radius: 10px;
        padding: 8px 10px;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-family: inherit;
      }

      .participant-row:hover {
        border-color: var(--accent);
      }

      .theme-chip {
        font-size: 10px;
        padding: 3px 8px;
        border-radius: 999px;
        border: 1px solid var(--accent-glow);
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 700;
      }

      .empty-box {
        border: 1px dashed var(--border-hover);
        border-radius: 12px;
        background: var(--surface);
        color: var(--muted);
        font-size: 13px;
        min-height: 140px;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 16px;
      }

      .loader {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        animation: spin 0.7s linear infinite;
      }

      .drawer-overlay {
        position: fixed;
        inset: 0;
        z-index: 120;
        background: rgba(2, 6, 23, 0.52);
        display: flex;
        justify-content: flex-end;
      }

      .drawer {
        width: min(520px, 96vw);
        background: var(--surface);
        border-left: 1px solid var(--border);
        box-shadow: -20px 0 44px var(--shadow);
        padding: 18px;
        overflow: auto;
      }

      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 14px;
      }

      .drawer-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .drawer-item {
        border: 1px solid var(--border);
        background: var(--surface-alt);
        border-radius: 12px;
        padding: 12px;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: var(--bg);
      }

      ::-webkit-scrollbar-thumb {
        background: var(--border-hover);
        border-radius: 4px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeUp {
        from {
          transform: translateY(8px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 1024px) {
        .chart-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .nd-header {
          padding: 0 14px;
          height: auto;
          min-height: 62px;
          gap: 10px;
        }

        .nd-controls-wrap {
          padding: 12px 14px;
          gap: 10px;
          align-items: stretch;
        }

        .control-item,
        .control-search,
        .control-sort {
          width: 100%;
          min-width: 100%;
        }

        .tabs-row {
          padding: 0 14px;
        }

        .tab-btn {
          padding: 12px 10px;
          font-size: 12px;
          white-space: nowrap;
        }

        .main-content {
          padding: 16px 14px;
        }

        .insight-grid {
          grid-template-columns: 1fr;
        }

        .theme-grid {
          grid-template-columns: 1fr;
        }

        .quality-grid {
          grid-template-columns: 1fr;
        }

        .nd-footer {
          padding: 12px 14px;
          flex-direction: column;
          gap: 5px;
        }
      }

      @media (max-width: 480px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }

        .panel {
          padding: 14px;
        }

        .drawer {
          width: 100vw;
          border-left: none;
        }
      }
    `}</style>
  );
}
