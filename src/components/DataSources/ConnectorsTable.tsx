import { Database } from "lucide-react";
import { memo } from "react";
import { Connector } from "./types/types";
import ConnectorRow from "./ConnectorRow";

interface ConnectorsTableProps {
  connectors: Connector[];
  onView: (connector: Connector) => void;
  onEdit: (connector: Connector) => void;
  onSync: (connector: Connector) => void;
  onDelete: (id: string) => void;
}

const ConnectorsTable: React.FC<ConnectorsTableProps> = memo(
  ({ connectors, onView, onEdit, onSync, onDelete }: ConnectorsTableProps) => {
    if (connectors.length === 0) {
      return (
        <div className="p-12 text-center">
          <Database className="mx-auto mb-3 text-gray-400" size={48} />
          <p className="text-gray-600 mb-1">No connectors found</p>
          <p className="text-sm text-gray-500">
            Create First Connector or Try adjusting your search or filters
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase">
                Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase">
                Type
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase">
                Last Sync
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {connectors.map((connector) => (
              <ConnectorRow
                key={connector.id}
                connector={connector}
                onView={() => onView(connector)}
                onEdit={() => onEdit(connector)}
                onSync={() => onSync(connector)}
                onDelete={() => onDelete(connector.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

export default ConnectorsTable;

ConnectorsTable.displayName = "ConnectorsTable";
