// Health / utilization ring gauge
export function RingGauge({
  value,
  size = 56,
  stroke = 6,
  label,
  tone = 'cat',
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: 'cat' | 'ok' | 'warn' | 'crit';
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const colors = {
    cat: '#FFCD11',
    ok: '#22C55E',
    warn: '#F59E0B',
    crit: '#EF4444',
  };
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2E34" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[tone]}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-semibold text-white">{Math.round(value)}</span>
        {label && <span className="text-[10px] text-ink-200">{label}</span>}
      </div>
    </div>
  );
}
