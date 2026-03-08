import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C, THEME_LABELS } from "../config";
import { CustomTooltip } from "../primitives";

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

export default function ThemesTab({ stats, filteredData }) {
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
