import { RefreshCw, Edit2, Trash2, Settings } from "lucide-react";
import { memo } from "react";
import { ALL_INTEGRATIONS } from "./utils/integrations";
import StatusBadge from "./StatusBadge";
import { Connector } from "./types/types";

interface ConnectorRowProps {
  connector: Connector;
  onView: () => void;
  onEdit: () => void;
  onSync: () => void;
  onDelete: () => void;
}

const ConnectorRow: React.FC<ConnectorRowProps> = memo(
  ({ connector, onView, onEdit, onSync, onDelete }: ConnectorRowProps) => (
    <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={onView}>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {connector.name}
          </div>
          {connector.tags && connector.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {connector.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {ALL_INTEGRATIONS.find((integration) => integration.name === connector.type)?.icon}
          </span>
          <span className="text-sm text-gray-700">{connector.type}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={connector.status} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {connector.lastSync || "Never"}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {/* <button
            onClick={onSync}
            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition"
            title="Sync Now"
          >
            <RefreshCw size={16} />
          </button> */}
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded transition"
            title="Quick Edit"
          >
            <Edit2 size={16} />
          </button>
          {/* <button
            className="p-2 text-gray-600 hover:text-gray-500 hover:bg-gray-50 rounded transition"
            title="Settings"
          >
            <Settings size={16} />
          </button> */}
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
);

export default ConnectorRow;

ConnectorRow.displayName = "ConnectorRow";
