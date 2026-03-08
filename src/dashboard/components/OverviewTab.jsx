import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ACTION_COLORS,
  C,
  FOCUS_MODES,
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
  TREND_LABELS,
} from "../config";
import { CustomTooltip, Pill, StatCard } from "../primitives";
import { formatPct } from "../utils";

export default function OverviewTab({
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
