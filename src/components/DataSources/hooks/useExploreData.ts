import { useState, useEffect, useRef } from "react";
import { transformationApi } from "../services/transformationApi";
import { useNotifications } from "./useNotifications";
import { MOCK_EXPLORE_DATA } from "../constants";

export const useExploreData = () => {
  const { addNotification } = useNotifications();
  const [exploreData, setExploreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadExploreData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadExploreData = async (forceRefresh = false) => {
    // Skip if already loaded and not forcing refresh
    if (hasLoadedRef.current && !forceRefresh) {
      console.log("Explore data already loaded, skipping...");
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    if(exploreData) return;

    setIsLoading(true);

    try {
      // ========== MOCK START ==========
      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 800));
      // setExploreData(MOCK_EXPLORE_DATA);
      // console.log("Mock explore data loaded:", MOCK_EXPLORE_DATA);
      // addNotification("success", "Database structure loaded");
      // ========== MOCK END ==========

      // ========== PRODUCTION  ==========
      const data = await transformationApi.exploreAllSources();
      console.log("Explore data from API:", data);
      setExploreData(data);
      hasLoadedRef.current = true;
      if (forceRefresh) {
        addNotification("success", "Database structure refreshed");
      } else {
        addNotification("success", "Database structure loaded");
      }
      // ========== PRODUCTION END ==========
    } catch (error: any) {
      // Ignore aborted requests
      if (error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      console.error("Failed to load explore data:", error);
      addNotification("error", "Failed to load database structure");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exploreData,
    isLoading,
    refreshExploreData: () => loadExploreData(true),
  };
};
