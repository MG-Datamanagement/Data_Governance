import {
  Plus,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { memo } from "react";
import StatsCard from "./StatsCard";
import { Connector, ConnectorStats } from "./types/types";
import SearchBar from "./SearchBar";
import ConnectorsTable from "./ConnectorsTable";

interface ConnectorsScreenProps {
  connectors: Connector[];
  stats: ConnectorStats;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  onNewConnector: () => void;
  onViewConnector: (connector: Connector) => void;
  onEditConnector: (connector: Connector) => void;
  onSyncConnector: (connector: Connector) => void;
  onDeleteConnector: (id: string) => void;
}

const ConnectorsScreen: React.FC<ConnectorsScreenProps> = memo(
  ({
    connectors,
    stats,
    searchTerm,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    filterCategory,
    onFilterCategoryChange,
    onNewConnector,
    onViewConnector,
    onEditConnector,
    onSyncConnector,
    onDeleteConnector,
  }: ConnectorsScreenProps) => (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Data Source Connectors
          </h1>
          <p className="text-sm text-gray-500">
            Manage and monitor your database connections
          </p>
        </div>

        <button
          onClick={onNewConnector}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
        >
          <Plus size={16} />
          New Connector
        </button>
      </div>

      {/* <div className="grid grid-cols-5 gap-4 mb-6">
        <StatsCard
          icon={Database}
          label="Total Connectors"
          value={stats.total}
          color="bg-blue-50"
        />
        <StatsCard
          icon={CheckCircle}
          label="Active"
          value={stats.active}
          trend="+12%"
          color="bg-green-50"
        />
        <StatsCard
          icon={XCircle}
          label="Inactive"
          value={stats.inactive}
          color="bg-gray-50"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Errors"
          value={stats.errors}
          color="bg-red-50"
        />
        <StatsCard
          icon={Activity}
          label="Records Processed"
          value={stats.totalRecords.toLocaleString()}
          trend="+24%"
          color="bg-purple-50"
        />
      </div> */}

      {/* {connectors.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <Database size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Connectors Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by creating your first data source connector
          </p>
          <button
            onClick={onNewConnector}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-sm inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Create First Connector
          </button>
        </div>
      ) : ( */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          filterStatus={filterStatus}
          onStatusChange={onFilterStatusChange}
          filterCategory={filterCategory}
          onCategoryChange={onFilterCategoryChange}
        />
        <ConnectorsTable
          connectors={connectors}
          onView={onViewConnector}
          onEdit={onEditConnector}
          onSync={onSyncConnector}
          onDelete={onDeleteConnector}
        />
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {connectors.length} connectors
          </div>
        </div>
      </div>
      {/* )} */}
    </div>
  )
);

export default ConnectorsScreen;

ConnectorsScreen.displayName = "ConnectorsScreen";
