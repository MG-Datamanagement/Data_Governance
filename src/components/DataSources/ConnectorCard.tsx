import React, { memo } from "react";
import { Edit2, RefreshCw, Settings, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { ALL_INTEGRATIONS } from "./utils/integrations";
import { Connector } from "./types/types";

interface ConnectorCardProps {
  connector: Connector;
  onSync: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

export const ConnectorCard = memo<ConnectorCardProps>(
  ({ connector, onSync, onEdit, onDelete, onViewDetails }) => {
    const dbType = ALL_INTEGRATIONS.find((integration) => integration.name === connector.type);

    return (
      <tr
        className="hover:bg-gray-50 transition cursor-pointer"
        onClick={onViewDetails}
      >
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
            <span className="text-lg">{dbType?.icon}</span>
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
            <button
              onClick={onSync}
              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition"
              title="Sync Now"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition"
              title="Settings"
            >
              <Settings size={16} />
            </button>
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
    );
  }
);

ConnectorCard.displayName = "ConnectorCard";
