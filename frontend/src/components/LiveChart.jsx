import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

export default function LiveChart({ data, keys, colors, title }) {
  const formatted = data.map((d, i) => ({
    ...d,
    t: i,
    ECG_HR:    d?.ECG_HR_mean,
    Radar_HR:  d?.Radar_HR_mean,
    HR_fused:  d?.HR_fused,
    RR:        d?.RR_mean,
  }));

  return (
    <div>
      {title && (
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>{title}</p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
          <XAxis dataKey="t" hide />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#7c8299", fontSize: 11 }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1d27", border: "1px solid #2e3347",
              borderRadius: 8, fontSize: 12
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#7c8299" }} />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i]}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}