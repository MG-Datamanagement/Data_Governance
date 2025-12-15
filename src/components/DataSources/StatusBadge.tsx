import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Clock,
  Pause,
} from "lucide-react";
import { memo } from "react";

interface StatusBadgeProps {
  status:
    | "active"
    | "inactive"
    | "error"
    | "testing"
    | "running"
    | "completed"
    | "failed"
    | "pending"
    | "success"
    | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = memo(
  ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
      error: "bg-red-100 text-red-700 border-red-200",
      testing: "bg-yellow-100 text-yellow-700 border-yellow-200",
      running: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-gray-100 text-gray-700 border-gray-200",
      success: "bg-green-100 text-green-700 border-green-200",
      paused: "bg-orange-100 text-orange-700 border-orange-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
      healthy: "bg-green-100 text-green-700 border-green-200",
      warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
      critical: "bg-red-100 text-red-700 border-red-200",
    };

    const icons: Record<string, React.ReactNode> = {
      active: <CheckCircle size={12} />,
      inactive: <XCircle size={12} />,
      error: <AlertTriangle size={12} />,
      testing: <Loader size={12} className="animate-spin" />,
      running: <Loader size={12} className="animate-spin" />,
      completed: <CheckCircle size={12} />,
      failed: <XCircle size={12} />,
      pending: <Clock size={12} />,
      success: <CheckCircle size={12} />,
      paused: <Pause size={12} />,
      cancelled: <XCircle size={12} />,
      healthy: <CheckCircle size={12} />,
      warning: <AlertTriangle size={12} />,
      critical: <XCircle size={12} />,
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${
          styles[status] || styles.inactive
        }`}
      >
        {icons[status] || icons.inactive}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
);

export default StatusBadge;

StatusBadge.displayName = "StatusBadge";
