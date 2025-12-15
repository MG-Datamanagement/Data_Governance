import { useState, useCallback, useEffect } from "react";
import { Connector } from "../types/types";
import { connectorApi } from "../services/connectorApi";
import { normalizeConnectorFromApi } from "../utils/normalizers/connectorNormalizer";
import { useNotifications } from "./useNotifications";
import { MOCK_CONNECTORS } from "../constants";

export const useConnectors = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Load all connectors
  const loadConnectors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("🔄 Loading connectors...");

    try {
      // ========== MOCK START ==========
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConnectors([]);
      // console.log("Mock connectors loaded:", MOCK_CONNECTORS.length);
      // ========== MOCK END ==========

      // ========== PRODUCTION  ==========
      // const apiResponse = await connectorApi.getAll();
      // const normalizedConnectors = apiResponse.map((api) =>
      //   normalizeConnectorFromApi(api)
      // );
      // setConnectors(normalizedConnectors);
      // console.log("Connectors loaded:", normalizedConnectors.length);

      // if (normalizedConnectors.length === 0) {
      //   addNotification(
      //     "info",
      //     "No connectors found. Create your first connector to get started."
      //   );
      // }
      // ========== PRODUCTION END ==========
    } catch (error: any) {
      const errorMsg = error.message || "Failed to load connectors";
      setError(errorMsg);
      addNotification("error", errorMsg);
      setConnectors([]);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Add connector
  const addConnector = useCallback(
    (connector: Connector) => {
      console.log(connector)
      setConnectors((prev) => [...prev, connector]);
      // addNotification(
      //   "success",
      //   `Connector "${connector.name}" created successfully`
      // );
    },
    [addNotification]
  );

  // Update connector
  const updateConnector = useCallback(
    (updatedConnector: Connector) => {
      setConnectors((prev) =>
        prev.map((c) => (c.id === updatedConnector.id ? updatedConnector : c))
      );
      addNotification(
        "success",
        `Connector "${updatedConnector.name}" updated successfully`
      );
    },
    [addNotification]
  );

  // Delete connector
  const deleteConnector = useCallback(
    async (connectorId: string) => {
      try {
        // ========== MOCK START ==========
        const deleted = connectors.find((c) => c.id === connectorId);
        setConnectors((prev) => prev.filter((c) => c.id !== connectorId));
        addNotification(
          "success",
          `Connector "${deleted?.name}" deleted successfully`
        );
        // ========== MOCK END ==========

        // ========== PRODUCTION  ==========
        // await connectorApi.delete(connectorId);
        // const deleted = connectors.find((c) => c.id === connectorId);
        // setConnectors((prev) => prev.filter((c) => c.id !== connectorId));
        // addNotification(
        //   "success",
        //   `Connector "${deleted?.name}" deleted successfully`
        // );
        // ========== PRODUCTION END ==========
      } catch (error: any) {
        addNotification("error", error.message || "Failed to delete connector");
        throw error;
      }
    },
    [connectors, addNotification]
  );

  // Sync connector
  const syncConnector = useCallback(
    async (connector: Connector) => {
      addNotification("info", `Syncing ${connector.name}...`);
      try {
        // ========== MOCK START ==========
        await new Promise((resolve) => setTimeout(resolve, 1000));
        addNotification("success", `${connector.name} synced successfully`);
        // ========== MOCK END ==========

        // ========== PRODUCTION  ==========
        // await connectorApi.sync(connector.id);
        // const apiResponse = await connectorApi.getById(connector.id);
        // const updatedConnector = normalizeConnectorFromApi(
        //   apiResponse,
        //   connector.name,
        //   connector.type,
        //   connector.category
        // );
        // updateConnector(updatedConnector);
        // addNotification("success", `${connector.name} synced successfully`);
        // ========== PRODUCTION END ==========
      } catch (error: any) {
        addNotification("error", error.message || "Sync failed");
      }
    },
    [addNotification, updateConnector]
  );

  // Load on mount
  useEffect(() => {
    loadConnectors();
  }, [loadConnectors]);

  return {
    connectors,
    isLoading,
    error,
    loadConnectors,
    addConnector,
    updateConnector,
    deleteConnector,
    syncConnector,
  };
};
