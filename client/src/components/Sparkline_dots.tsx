interface Sparkline_dots_props {
  values: number[];
  width?: number;
  height?: number;
}

export function Sparkline_dots({
  values,
  width = 120,
  height = 32
}: Sparkline_dots_props) {
  if (!values.length) {
    return (
      <svg width={width} height={height} className="opacity-40">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#27272f"
          strokeWidth={1}
        />
      </svg>
    );
  }

  const max_points = Math.max(values.length, 2);
  const step_x = width / (max_points - 1);

  const min_val = Math.min(...values);
  const max_val = Math.max(...values);

  const range = max_val - min_val || 1;

  const points = values.map((v, idx) => {
    const x = idx * step_x;
    const norm = (v - min_val) / range;
    const y = height - norm * (height - 6) - 3;
    return { x, y };
  });

  const path_d = points
    .map((p, idx) =>
      idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    )
    .join(" ");

  const last_point = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      className="text-sky-400/80"
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* base line */}
      <line
        x1={0}
        y1={height - 3}
        x2={width}
        y2={height - 3}
        stroke="#18181b"
        strokeWidth={1}
      />

      {/* trail line */}
      <path
        d={path_d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* dots */}
      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r={idx === points.length - 1 ? 2.1 : 1.4}
          fill={idx === points.length - 1 ? "#38bdf8" : "#0ea5e9"}
          opacity={idx === points.length - 1 ? 1 : 0.7}
        />
      ))}

      {/* last point glow */}
      <circle
        cx={last_point.x}
        cy={last_point.y}
        r={4}
        fill="#0ea5e9"
        opacity={0.18}
      />
    </svg>
  );
}
