"use client";

import React, { useState } from "react";
import DeleteConfirmModal from "@/components/DataSources/DeleteConfirmDialog";
import ConnectorDetailsDrawer from "@/components/DataSources/ConnectorDetailsDrawer";
import NewConnectorModal from "@/components/DataSources/NewConnectorModal";
import QueryEngineScreen from "@/components/DataSources/QueryEngineScreen";
import ConnectorsScreen from "@/components/DataSources/ConnectorsScreen";
import Navigation from "@/components/DataSources/Navigation";
import { ScreensEnum } from "@/components/DataSources/constants";
import { useNotifications } from "@/components/DataSources/hooks/useNotifications";
import { useConnectors } from "@/components/DataSources/hooks/useConnectors";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Connector } from "@/components/DataSources/types/types";
import { Loader } from "lucide-react";
import { useDebounce } from "@/components/DataSources/hooks/useDebounce";

const DataSourcePlatform = () => {
  const { addNotification,notifications } = useNotifications();
  const {
    connectors,
    isLoading,
    addConnector,
    updateConnector,
    deleteConnector,
    syncConnector,
  } = useConnectors();

  const [currentScreen, setCurrentScreen] = useState<ScreensEnum>(
    ScreensEnum.connectors
  );
  const [showNewConnector, setShowNewConnector] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtered connectors
  const filteredConnectors = connectors.filter((connector) => {
    const matchesSearch =
      connector.name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      connector.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || connector.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || connector.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const stats = {
    total: connectors.length,
    active: connectors.filter((c) => c.status === "active").length,
    inactive: connectors.filter((c) => c.status === "inactive").length,
    errors: connectors.reduce((sum, c) => sum + (c.errorCount || 0), 0),
    totalRecords: connectors.reduce(
      (sum, c) => sum + (c.recordsProcessed || 0),
      0
    ),
  };

  const handleViewDetails = (connector: Connector) => {
    setSelectedConnector(connector);
    setShowDetailsDrawer(true);
  };

  const handleEditConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setShowDetailsDrawer(true);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteConnector(showDeleteConfirm);
      setShowDeleteConfirm(null);
    } catch (error) {
      // Error already handled in hook
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader
  //           size={48}
  //           className="animate-spin text-red-500 mx-auto mb-4"
  //         />
  //         <p className="text-gray-600">Loading connectors...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-left { animation: slide-left 0.3s ease-out; }
      `}</style>

      <Navigation
        currentScreen={currentScreen}
        onScreenChange={(screen: ScreensEnum) => setCurrentScreen(screen)}
      />

      <main>
        {currentScreen === ScreensEnum.connectors && (
          <ConnectorsScreen
            connectors={filteredConnectors}
            stats={stats}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            onNewConnector={() => setShowNewConnector(true)}
            onViewConnector={handleViewDetails}
            onEditConnector={handleEditConnector}
            onSyncConnector={syncConnector}
            onDeleteConnector={(id: string) => setShowDeleteConfirm(id)}
          />
        )}

        {currentScreen === ScreensEnum.query && (
          <QueryEngineScreen connectors={connectors} />
        )}
      </main>

      {showNewConnector && (
        <NewConnectorModal
          show={showNewConnector}
          onClose={() => setShowNewConnector(false)}
          onCreateConnector={(connector) => {
            addConnector(connector);
            setShowNewConnector(false);
          }}
        />
      )}

      {showDetailsDrawer && (
        <ConnectorDetailsDrawer
          connector={selectedConnector}
          isOpen={showDetailsDrawer}
          onClose={() => {
            setShowDetailsDrawer(false);
            setSelectedConnector(null);
          }}
          onUpdate={updateConnector}
        />
      )}

      <DeleteConfirmModal
        connector={connectors.find((c) => c.id === showDeleteConfirm) || null}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </div>
  );
};

export default function WrappedDataSourcePlatform() {
  return (
    <ErrorBoundary>
      <DataSourcePlatform />
    </ErrorBoundary>
  );
}
