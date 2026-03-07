import { useState, useEffect, useMemo } from "react";
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
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

// ─── Design Tokens ───────────────────────────────────────────────
const C = {
  bg: "#0a0c10",
  surface: "#111318",
  border: "#1e2230",
  borderHover: "#2e3450",
  accent: "#6c63ff",
  accentSoft: "rgba(108,99,255,0.15)",
  accentGlow: "rgba(108,99,255,0.4)",
  positive: "#22d3a0",
  positiveSoft: "rgba(34,211,160,0.12)",
  neutral: "#f59e0b",
  neutralSoft: "rgba(245,158,11,0.12)",
  negative: "#f43f5e",
  negativeSoft: "rgba(244,63,94,0.12)",
  watch: "#fb923c",
  escalate: "#ef4444",
  followUp: "#a78bfa",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#334155",
};

const SENTIMENT_COLORS = {
  positive: C.positive,
  neutral: C.neutral,
  negative: C.negative,
  "": C.textDim,
};

const ACTION_COLORS = {
  watch: C.watch,
  follow_up: C.followUp,
  escalate: C.escalate,
  ignore: C.textDim,
};

const THEME_LABELS = {
  communication: "İletişim",
  culture: "Kültür",
  process: "Süreç",
  learning_development: "Gelişim",
  tools_systems: "Araçlar",
  team_dynamics: "Takım",
  fairness: "Adalet",
  manager_behavior: "Yönetici",
  compensation: "Ücret",
  workload: "İş Yükü",
};

// ─── Embedded CSV (loaded at runtime) ────────────────────────────
const CSV_URL = "./data.csv";

// ─── Helpers ─────────────────────────────────────────────────────
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function formatSurveyId(id) {
  return String(id).slice(-6);
}

// ─── Micro Components ─────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
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
      padding: "6px 12px",
      borderRadius: 8,
      background: `${color}14`,
      border: `1px solid ${color}30`,
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
    <span style={{ color: C.textMuted, fontSize: 12 }}>{label}</span>
    <span style={{ color, fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>
      {value}
    </span>
  </div>
);

const StatCard = ({ label, value, sub, accent, icon }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.borderColor = accent || C.borderHover)
    }
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 80,
        height: 80,
        borderRadius: "0 16px 0 80px",
        background: `${accent || C.accent}0d`,
      }}
    />
    <span style={{ fontSize: 22 }}>{icon}</span>
    <div
      style={{
        fontSize: 32,
        fontWeight: 800,
        color: accent || C.text,
        fontFamily: "'DM Mono', monospace",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{sub}</div>
    )}
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1d27",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        color: C.text,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {label && (
        <div style={{ color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.fill || p.color,
            }}
          />
          <span style={{ color: C.textMuted }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Insight Card ─────────────────────────────────────────────────
const InsightCard = ({ item, index }) => {
  const actionColor = ACTION_COLORS[item.action] || C.textMuted;
  const sentColor = SENTIMENT_COLORS[item.sentiment] || C.textDim;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${actionColor}`,
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "all 0.2s",
        cursor: "default",
        animationDelay: `${index * 0.04}s`,
        animation: "fadeUp 0.4s ease both",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = actionColor;
        e.currentTarget.style.background = "#151820";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.borderLeftColor = actionColor;
        e.currentTarget.style.background = C.surface;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.text,
              lineHeight: 1.4,
              marginBottom: 4,
            }}
          >
            {item.display_label || item.summary || "—"}
          </div>
          {item.display_note && (
            <div
              style={{
                fontSize: 12,
                color: C.textMuted,
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              "{item.display_note}"
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <Badge color={actionColor}>{item.action}</Badge>
          {item.sentiment && <Badge color={sentColor}>{item.sentiment}</Badge>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <ScoreBar value={item.score} />
        {item.themes?.slice(0, 3).map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 6,
              background: C.accentSoft,
              color: C.accent,
              border: `1px solid ${C.accentGlow}`,
              fontWeight: 600,
            }}
          >
            {THEME_LABELS[t] || t}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.textDim }}>
          #{item.participant_id} · Q{item.question_id}
        </span>
      </div>
    </div>
  );
};

const ScoreBar = ({ value }) => {
  const pct = Math.round((parseFloat(value) || 0) * 100);
  const color =
    pct >= 70 ? C.positive : pct >= 40 ? C.neutral : C.negative;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 60,
          height: 4,
          borderRadius: 2,
          background: C.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
        {pct}%
      </span>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────
export default function NeDendy() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("severity");
  const [activeTab, setActiveTab] = useState("overview");

  // Load CSV
  useEffect(() => {
    Papa.parse(CSV_URL, {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed = data.map((row) => ({
          ...row,
          score: parseFloat(row.score) || 0,
          severity: parseFloat(row.severity) || 0,
          confidence: parseFloat(row.confidence) || 0,
          themes: parseJSON(row.themes),
          risk_flags: parseJSON(row.risk_flags),
        }));
        setAllData(parsed);
        setLoading(false);
      },
    });
  }, []);

  const surveyIds = useMemo(() => {
    const ids = [...new Set(allData.map((d) => d.survey_id))].sort();
    return ids;
  }, [allData]);

  const filteredData = useMemo(() => {
    return allData.filter((d) => {
      if (selectedSurvey !== "all" && d.survey_id !== selectedSurvey) return false;
      if (actionFilter !== "all" && d.action !== actionFilter) return false;
      if (sentimentFilter !== "all" && d.sentiment !== sentimentFilter) return false;
      if (
        searchQuery &&
        !(d.display_label + d.display_note + d.summary)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allData, selectedSurvey, actionFilter, sentimentFilter, searchQuery]);

  const displayData = useMemo(() => {
    return filteredData
      .filter((d) => d.should_display === "t" || d.action !== "ignore")
      .sort((a, b) => {
        if (sortBy === "severity") return b.severity - a.severity;
        if (sortBy === "score") return b.score - a.score;
        if (sortBy === "confidence") return b.confidence - a.confidence;
        return 0;
      });
  }, [filteredData, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const d = filteredData;
    const total = d.length;
    const sentCounts = { positive: 0, neutral: 0, negative: 0, "": 0 };
    const actionCounts = { watch: 0, follow_up: 0, escalate: 0, ignore: 0 };
    const themeMap = {};
    let scoreSum = 0;
    let scoreCount = 0;

    d.forEach((row) => {
      sentCounts[row.sentiment] = (sentCounts[row.sentiment] || 0) + 1;
      actionCounts[row.action] = (actionCounts[row.action] || 0) + 1;
      if (row.score > 0) {
        scoreSum += row.score;
        scoreCount++;
      }
      row.themes.forEach((t) => {
        themeMap[t] = (themeMap[t] || 0) + 1;
      });
    });

    const avgScore = scoreCount ? scoreSum / scoreCount : 0;
    const topThemes = Object.entries(themeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: THEME_LABELS[name] || name, count }));

    const sentPie = Object.entries(sentCounts)
      .filter(([k]) => k !== "")
      .map(([name, value]) => ({ name, value }));

    const actionPie = Object.entries(actionCounts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    const urgentCount =
      actionCounts.escalate + actionCounts.follow_up + actionCounts.watch;

    return {
      total,
      avgScore,
      sentCounts,
      actionCounts,
      topThemes,
      sentPie,
      actionPie,
      urgentCount,
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${C.border}`,
            borderTopColor: C.accent,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ color: C.textMuted, fontSize: 14 }}>
          Veri yükleniyor...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.borderHover}; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        select { appearance: none; }
      `}</style>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: `1px solid ${C.border}`,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,12,16,0.92)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.accent}, #9c5fff)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              boxShadow: `0 0 16px ${C.accentGlow}`,
            }}
          >
            🔮
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: C.text,
              }}
            >
              Ne Dendy?
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.08em" }}>
              ANKET ANALİZ MODÜLÜ
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.positive,
                animation: "pulse 2s ease-in-out infinite",
                boxShadow: `0 0 6px ${C.positive}`,
              }}
            />
            <span style={{ fontSize: 12, color: C.textMuted }}>
              {allData.length.toLocaleString()} kayıt
            </span>
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: C.accentSoft,
              border: `1px solid ${C.accentGlow}`,
              fontSize: 12,
              fontWeight: 600,
              color: C.accent,
            }}
          >
            {surveyIds.length} Anket
          </div>
        </div>
      </header>

      {/* ─── Controls ───────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          background: C.surface,
        }}
      >
        {/* Survey Dropdown */}
        <div style={{ position: "relative" }}>
          <select
            value={selectedSurvey}
            onChange={(e) => setSelectedSurvey(e.target.value)}
            style={{
              background: C.bg,
              color: C.text,
              border: `1px solid ${selectedSurvey !== "all" ? C.accent : C.border}`,
              borderRadius: 10,
              padding: "8px 36px 8px 14px",
              fontSize: 13,
              fontFamily: "inherit",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              minWidth: 180,
            }}
          >
            <option value="all">Tüm Anketler</option>
            {surveyIds.map((id) => (
              <option key={id} value={id}>
                Anket #{formatSurveyId(id)}
              </option>
            ))}
          </select>
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted,
              pointerEvents: "none",
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </div>

        {/* Action Filter */}
        <div style={{ position: "relative" }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              background: C.bg,
              color: C.text,
              border: `1px solid ${actionFilter !== "all" ? C.watch : C.border}`,
              borderRadius: 10,
              padding: "8px 36px 8px 14px",
              fontSize: 13,
              fontFamily: "inherit",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">Tüm Aksiyonlar</option>
            <option value="escalate">🔴 Escalate</option>
            <option value="follow_up">🟣 Follow Up</option>
            <option value="watch">🟠 Watch</option>
            <option value="ignore">⚫ Ignore</option>
          </select>
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted,
              pointerEvents: "none",
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </div>

        {/* Sentiment Filter */}
        <div style={{ position: "relative" }}>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            style={{
              background: C.bg,
              color: C.text,
              border: `1px solid ${sentimentFilter !== "all" ? C.neutral : C.border}`,
              borderRadius: 10,
              padding: "8px 36px 8px 14px",
              fontSize: 13,
              fontFamily: "inherit",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">Tüm Duygular</option>
            <option value="positive">😊 Pozitif</option>
            <option value="neutral">😐 Nötr</option>
            <option value="negative">😔 Negatif</option>
          </select>
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted,
              pointerEvents: "none",
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted,
              fontSize: 13,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="İçgörü ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: C.bg,
              color: C.text,
              border: `1px solid ${searchQuery ? C.accent : C.border}`,
              borderRadius: 10,
              padding: "8px 14px 8px 34px",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>Sırala:</span>
          {["severity", "score", "confidence"].map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${sortBy === s ? C.accent : C.border}`,
                background: sortBy === s ? C.accentSoft : "transparent",
                color: sortBy === s ? C.accent : C.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {s === "severity" ? "Önem" : s === "score" ? "Skor" : "Güven"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 0,
          padding: "0 32px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {[
          { id: "overview", label: "Genel Bakış", icon: "📊" },
          { id: "insights", label: "İçgörüler", icon: "💡" },
          { id: "themes", label: "Temalar", icon: "🗂️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "14px 20px",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? C.accent : "transparent"}`,
              background: "transparent",
              color: activeTab === tab.id ? C.accent : C.textMuted,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            {filteredData.length} sonuç
          </span>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "28px 32px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {activeTab === "overview" && (
          <OverviewTab stats={stats} />
        )}
        {activeTab === "insights" && (
          <InsightsTab data={displayData} />
        )}
        {activeTab === "themes" && (
          <ThemesTab stats={stats} filteredData={filteredData} />
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: C.textDim }}>
          Dendy · Ne Dendy? Modülü · v1.0
        </span>
        <span style={{ fontSize: 11, color: C.textDim }}>
          {new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </footer>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────
function OverviewTab({ stats }) {
  const { total, avgScore, sentCounts, actionCounts, sentPie, actionPie, urgentCount } = stats;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard
          label="Toplam Yanıt"
          value={total.toLocaleString()}
          icon="📋"
          accent={C.accent}
        />
        <StatCard
          label="Ort. Skor"
          value={`${Math.round(avgScore * 100)}%`}
          sub="Tüm yanıtların ortalaması"
          icon="📈"
          accent={avgScore > 0.6 ? C.positive : avgScore > 0.4 ? C.neutral : C.negative}
        />
        <StatCard
          label="Pozitif Yanıt"
          value={sentCounts.positive?.toLocaleString() || 0}
          sub={`${Math.round(((sentCounts.positive || 0) / total) * 100)}% oranında`}
          icon="✅"
          accent={C.positive}
        />
        <StatCard
          label="İzleme Gereken"
          value={urgentCount.toLocaleString()}
          sub="watch + follow_up + escalate"
          icon="⚠️"
          accent={C.watch}
        />
        <StatCard
          label="Escalate"
          value={actionCounts.escalate || 0}
          sub="Acil müdahale gerektirir"
          icon="🔴"
          accent={C.escalate}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Sentiment Donut */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: C.text }}>
            Duygu Dağılımı
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={sentPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sentPie.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SENTIMENT_COLORS[entry.name]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {sentPie.map((s) => (
                <Pill
                  key={s.name}
                  label={s.name === "positive" ? "Pozitif" : s.name === "negative" ? "Negatif" : "Nötr"}
                  value={s.value}
                  color={SENTIMENT_COLORS[s.name]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: C.text }}>
            Aksiyon Dağılımı
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={actionPie} margin={{ left: -10 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: C.textMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.textMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `${C.accent}10` }} />
              <Bar dataKey="value" name="Adet" radius={[6, 6, 0, 0]}>
                {actionPie.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={ACTION_COLORS[entry.name] || C.textDim}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Summary */}
      {actionCounts.escalate > 0 && (
        <div
          style={{
            background: `${C.escalate}08`,
            border: `1px solid ${C.escalate}40`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${C.escalate}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🚨
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.escalate, marginBottom: 2 }}>
              {actionCounts.escalate} yanıt escalate durumunda
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              Bu yanıtlar acil inceleme ve müdahale gerektiriyor. İçgörüler sekmesinden detaylara ulaşabilirsiniz.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Insights Tab ─────────────────────────────────────────────────
function InsightsTab({ data }) {
  const actionGroups = useMemo(() => {
    const groups = { escalate: [], follow_up: [], watch: [], other: [] };
    data.forEach((d) => {
      if (d.action === "escalate") groups.escalate.push(d);
      else if (d.action === "follow_up") groups.follow_up.push(d);
      else if (d.action === "watch") groups.watch.push(d);
      else groups.other.push(d);
    });
    return groups;
  }, [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {actionGroups.escalate.length > 0 && (
        <Section
          title="🔴 Escalate"
          subtitle="Acil müdahale gerektiren yanıtlar"
          color={C.escalate}
          items={actionGroups.escalate}
        />
      )}
      {actionGroups.follow_up.length > 0 && (
        <Section
          title="🟣 Follow Up"
          subtitle="Takip edilmesi gereken yanıtlar"
          color={C.followUp}
          items={actionGroups.follow_up}
        />
      )}
      {actionGroups.watch.length > 0 && (
        <Section
          title="🟠 İzleme"
          subtitle="Yakından takip edilmesi önerilen yanıtlar"
          color={C.watch}
          items={actionGroups.watch}
        />
      )}
      {actionGroups.other.length > 0 && (
        <Section
          title="⚫ Diğer"
          subtitle="Eylem gerektirmeyen yanıtlar"
          color={C.textDim}
          items={actionGroups.other}
          collapsed
        />
      )}
      {data.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 0",
            color: C.textMuted,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Sonuç bulunamadı</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Filtrelerinizi değiştirmeyi deneyin</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, color, items, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "transparent",
          border: "none",
          padding: "0 0 14px 0",
          cursor: "pointer",
          textAlign: "left",
          color: C.text,
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            width: 3,
            height: 20,
            borderRadius: 2,
            background: color,
          }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{subtitle}</div>
        </div>
        <Badge color={color}>{items.length}</Badge>
        <span
          style={{
            marginLeft: "auto",
            color: C.textMuted,
            fontSize: 12,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 10,
          }}
        >
          {items.map((item, i) => (
            <InsightCard key={item.label_id || i} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Themes Tab ───────────────────────────────────────────────────
function ThemesTab({ stats, filteredData }) {
  const { topThemes } = stats;

  // Sentiment breakdown per theme
  const themeDetails = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      row.themes.forEach((t) => {
        if (!map[t]) map[t] = { positive: 0, neutral: 0, negative: 0, total: 0, scores: [] };
        map[t][row.sentiment] = (map[t][row.sentiment] || 0) + 1;
        map[t].total++;
        if (row.score) map[t].scores.push(row.score);
      });
    });
    return map;
  }, [filteredData]);

  const radarData = topThemes.map((t) => ({
    theme: t.name,
    count: t.count,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Radar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: C.text }}>
            Tema Radar
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis
                dataKey="theme"
                tick={{ fill: C.textMuted, fontSize: 10 }}
              />
              <Radar
                dataKey="count"
                name="Frekans"
                fill={C.accent}
                fillOpacity={0.25}
                stroke={C.accent}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Themes Bar */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: C.text }}>
            En Sık Temalar
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topThemes} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: C.textMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `${C.accent}10` }} />
              <Bar dataKey="count" name="Adet" fill={C.accent} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Theme Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {Object.entries(themeDetails)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([theme, d]) => {
            const label = THEME_LABELS[theme] || theme;
            const avgScore = d.scores.length ? avg(d.scores) : 0;
            const posRate = d.total ? d.positive / d.total : 0;
            return (
              <div
                key={theme}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{label}</div>
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: 20,
                      fontWeight: 800,
                      color: C.accent,
                    }}
                  >
                    {d.total}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <MiniBar label="Pozitif" value={d.positive} total={d.total} color={C.positive} />
                  <MiniBar label="Nötr" value={d.neutral} total={d.total} color={C.neutral} />
                  <MiniBar label="Negatif" value={d.negative} total={d.total} color={C.negative} />
                </div>
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${C.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: C.textMuted,
                  }}
                >
                  <span>Ort. Skor: <span style={{ color: C.text, fontWeight: 700 }}>{Math.round(avgScore * 100)}%</span></span>
                  <span>Pozitif: <span style={{ color: C.positive, fontWeight: 700 }}>{Math.round(posRate * 100)}%</span></span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function MiniBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.textMuted, width: 50, flexShrink: 0 }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: C.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, width: 28, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
