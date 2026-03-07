import { C } from "./config";
import { toNumber } from "./utils";

export const Badge = ({ color, children }) => (
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

export const Pill = ({ label, value, color }) => (
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

export const StatCard = ({ label, value, sub, accent, icon }) => (
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

export const ScoreBar = ({ value }) => {
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

export const CustomTooltip = ({ active, payload, label }) => {
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
