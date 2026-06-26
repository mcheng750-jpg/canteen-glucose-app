import { levelMeta } from "../glucose";

export function Legend() {
  const items = [levelMeta.low, levelMeta.medium, levelMeta.high, levelMeta.insufficient];
  return (
    <div className="legend">
      {items.map((item) => (
        <div key={item.label} className="legend-item">
          <span style={{ background: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
