import { memo } from "react";
import { AnalyticsMetric, ChartDataPoint, ConnectorHealth } from "./types/types";
import { TrendingUp, ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";


interface MetricCardProps {
  metric: AnalyticsMetric;
}

export const MetricCard:React.FC<MetricCardProps> = memo(({ metric }: MetricCardProps) => {
  const trendColors = {
    up: metric.label.includes("Failed") || metric.label.includes("Error") 
      ? "text-red-600" 
      : "text-green-600",
    down: metric.label.includes("Failed") || metric.label.includes("Error")
      ? "text-green-600"
      : "text-red-600",
    neutral: "text-gray-600",
  };

  const trendIcons = {
    up: <TrendingUp size={14} />,
    down: <TrendingUp size={14} className="rotate-180" />,
    neutral: <ArrowRight size={14} />,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium text-gray-600">{metric.label}</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColors[metric.trend]}`}>
          {trendIcons[metric.trend]}
          <span>{metric.change}</span>
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
      </div>
      <div className="text-xs text-gray-500">{metric.period}</div>
    </div>
  );
});


MetricCard.displayName = "MetricCard";


interface SimpleLineChartProps {
  data: ChartDataPoint[];
  color: string;
  label: string;
  height?: number;
}

export const SimpleLineChart:React.FC<SimpleLineChartProps> = memo(({ data, color, label, height = 200 }: SimpleLineChartProps) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <div className="text-2xl font-bold text-gray-900 mt-1">
          {data[data.length - 1]?.value.toLocaleString()}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={`url(#gradient-${color})`}
          />
        </svg>
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <span>{data[0]?.timestamp}</span>
        <span>{data[data.length - 1]?.timestamp}</span>
      </div>
    </div>
  );
});

SimpleLineChart.displayName = "SimpleLineChart";


interface ConnectorHealthCardProps {
  health: ConnectorHealth;
}

export const ConnectorHealthCard:React.FC<ConnectorHealthCardProps> = memo(({ health }: ConnectorHealthCardProps) => {
  const statusColors = {
    healthy: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    critical: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcons = {
    healthy: <CheckCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    critical: <XCircle size={16} />,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{health.connectorName}</h4>
          <div className="text-xs text-gray-500 mt-1">Last check: {health.lastCheck}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusColors[health.status]}`}>
          {statusIcons[health.status]}
          {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-gray-500 mb-1">Uptime</div>
          <div className="text-sm font-semibold text-gray-900">{health.uptime}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Response</div>
          <div className="text-sm font-semibold text-gray-900">{health.responseTime}ms</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Errors</div>
          <div className="text-sm font-semibold text-gray-900">{health.errorCount}</div>
        </div>
      </div>
    </div>
  );
});

ConnectorHealthCard.displayName = "ConnectorHealthCard";