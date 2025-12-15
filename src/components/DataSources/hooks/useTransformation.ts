import { useState, useCallback, useEffect, useRef } from "react";
import {
  TableSelection,
  TransformationRequest,
  Connector,
} from "../types/types";
import { transformationApi } from "../services/transformationApi";
import { useNotifications } from "./useNotifications";

export const useTransformation = (
  selectedConnectorId: string,
  connectors: Connector[]
) => {
  const { addNotification } = useNotifications();
  const [tables, setTables] = useState<TableSelection[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");

  const executeTransformation = useCallback(
    async (request: TransformationRequest) => {
      try {
        // ========== PRODUCTION  ==========
        const result = await transformationApi.transformData(request);
        if (!result.success) {
          addNotification("error", "Transformation failed");
          throw new Error("Transformation failed");
        }
        addNotification(
          "success",
          "Transformation Executed and Preview generated successfully!"
        );
        return result;
        // ========== PRODUCTION END ==========
      } catch (error: any) {
        console.error("Transformation error:", error);
        addNotification(
          "error",
          error.message || "Failed to execute transformation"
        );
        throw error;
      }
    },
    [addNotification]
  );

  return {
    tables,
    setTables,
    selectedSource,
    executeTransformation,
  };
};
