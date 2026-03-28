"use client";

/**
 * useIngestionSidebar.ts
 *
 * Custom hook that encapsulates all state, effects, refs, and API handlers
 * for the IngestionSidebar component. Extracted from IngestionSidebar.tsx
 * to reduce the component body from 17 useState + 4 useEffect to a single hook call.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { CONSTANTS } from "@/lib/constants";
import { dashboardApiServices, SourceAiSummaryResponse } from "@/services/dashboardApi.service";
import { useGetIngestionLoadingStages, useGetPostIngestionLoadingStages } from "@/hooks/useDashboardQueries";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface IngestionLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface IngestionStep {
  label: string;
  description?: string;
}

export type IngestionPhase = "scanning" | "completing" | "done";
export type StreamStatus = "connecting" | "connected" | "completed" | "error";

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useIngestionSidebar(
  jobId: string,
  isOpen: boolean,
  onClose: (viewIngestedDataset: boolean) => void,
) {
  const STEP_DURATION = 1800;
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [steps, setSteps] = useState<IngestionStep[]>([]);
  const [ingestionStepsCount, setIngestionStepsCount] = useState(0);
  const [phase, setPhase] = useState<IngestionPhase>("scanning");
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isThinking, setIsThinking] = useState(true);
  const [progress, setProgress] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [showNotification, setShowNotification] = useState(true);
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("connecting");
  const [sourceAiSummary, setSourceAiSummary] = useState<SourceAiSummaryResponse | null>(null);
  const [isSourceAiSummaryLoading, setIsSourceAiSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [hasAttemptedPhase2, setHasAttemptedPhase2] = useState(false);

  const { addDsConfig, setAddDsConfig } = useAppStore();

  // Pre-fetch both stage lists via React Query (staleTime:Infinity → shared cache)
  const { data: ingestionStagesData } = useGetIngestionLoadingStages();
  const { data: postIngestionStagesData } = useGetPostIngestionLoadingStages();

  // ── Step Animation ─────────────────────────────────────────────────────────
  const advanceStep = useCallback((idx: number, stepList: IngestionStep[], onComplete?: () => void) => {
    if (idx >= stepList.length) { onComplete?.(); return; }
    setCurrentStepIdx(idx);
    setProgress(Math.min(idx + 1, stepList.length));

    stepTimerRef.current = setTimeout(() => {
      setCompletedSteps(prev => new Set(prev).add(idx));
      if (scrollRef.current && idx > stepList.length * 0.7) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
      const nextIdx = idx + 1;
      if (nextIdx < stepList.length) {
        advanceStep(nextIdx, stepList, onComplete);
      } else {
        onComplete?.();
      }
    }, STEP_DURATION);
  }, []);

  // ── Initial Step Fetch ─────────────────────────────────────────────────────
  const fetchInitialSteps = useCallback(async () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    try {
      const ingestionLoads = ingestionStagesData?.ingestion_loads ?? [];
      const postLoads = postIngestionStagesData?.reasoning_loads ?? [];
      const ingestionSteps = ingestionLoads.map((label: string) => ({ label }));
      const postSteps = postLoads.map((label: string) => ({ label }));
      const allSteps = [...ingestionSteps, ...postSteps];

      setSteps(allSteps);
      setTotalSteps(allSteps.length);
      setIngestionStepsCount(ingestionSteps.length);

      if (!addDsConfig?.piiApproval) {
        setHasAttemptedPhase2(true);
        handleBatchApis();
      }

      const animationSteps = !addDsConfig?.piiApproval ? allSteps : ingestionSteps;
      setTimeout(() => {
        advanceStep(0, animationSteps, () => {
          if (!addDsConfig?.piiApproval) {
            setPhase("done");
            setStreamStatus("completed");
          } else {
            setStreamStatus("completed");
            setTimeout(() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
            }, 500);
          }
        });
      }, 0);
    } catch (e) {
      logger.error("Error fetching ingestion steps:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingestionStagesData, postIngestionStagesData, addDsConfig?.piiApproval, advanceStep]);

  // ── Phase 2 Continuation ─────────────────────────────────────────────────
  const appendPostIngestionSteps = useCallback(async () => {
    setIsThinking(true);
    setIsComplete(false);
    setHasAttemptedPhase2(true);

    if (steps.length > ingestionStepsCount) {
      advanceStep(ingestionStepsCount, steps, () => {
        setPhase("done");
        setStreamStatus("completed");
      });
      return;
    }

    try {
      const newSteps = (postIngestionStagesData?.reasoning_loads ?? []).map((label: string) => ({ label }));
      setSteps(prev => {
        const combined = [...prev, ...newSteps];
        advanceStep(ingestionStepsCount, combined, () => {
          setPhase("done");
          setStreamStatus("completed");
        });
        return combined;
      });
    } catch (e) {
      logger.error("Error appending post-ingestion steps:", e);
    }
  }, [steps, ingestionStepsCount, postIngestionStagesData, advanceStep]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (phase === "done" && !isSourceAiSummaryLoading && streamStatus === "completed") {
      const timer = setTimeout(() => { setIsComplete(true); setIsThinking(false); }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, isSourceAiSummaryLoading, streamStatus]);

  useEffect(() => {
    if (isOpen && jobId && addDsConfig?.sourceId && ingestionStagesData && postIngestionStagesData) {
      fetchInitialSteps();
      const notificationTimer = setTimeout(() => setShowNotification(false), 5000);
      return () => {
        clearTimeout(notificationTimer);
        if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      };
    } else if (!isOpen) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      setSteps([]);
      setCurrentStepIdx(-1);
      setCompletedSteps(new Set());
      setIsComplete(false);
      setIsThinking(true);
      setPhase("scanning");
      setProgress(0);
      setTotalSteps(6);
      setLogs([]);
      setStreamStatus("connecting");
      setSourceAiSummary(null);
      setIsSourceAiSummaryLoading(false);
      setSummaryError(false);
      setHasAttemptedPhase2(false);
      setShowNotification(true);
      setIsProgressExpanded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jobId, addDsConfig?.sourceId, ingestionStagesData, postIngestionStagesData]);

  useEffect(() => {
    if (!jobId || !isOpen || !addDsConfig?.sourceId) return;
    setLogs(prev => prev.length === 0 ? [{ timestamp: new Date().toISOString(), level: "info", message: "Connected to data source stream." }] : prev);
  }, [jobId, isOpen, addDsConfig?.sourceId]);

  // ── API Handlers ─────────────────────────────────────────────────────────
  const handleBatchApis = async () => {
    setIsSourceAiSummaryLoading(true);
    try {
      await Promise.allSettled([
        handleTableClassification(),
        handleColumnClassification(),
        handleGenerateBulkDataCards(),
        handleFetchIngestionSourceAiSummary(),
      ]);
    } catch (err) {
      logger.error("Error during classification and AI summary:", err);
    } finally {
      setIsSourceAiSummaryLoading(false);
    }
  };

  const handleTableClassification = async () => {
    try {
      await dashboardApiServices.initPiiClassification({
        source_id: addDsConfig.sourceId,
        Require_human_approval: addDsConfig.piiApproval,
        assigned_by: CONSTANTS.assignedBy,
        min_confidence: CONSTANTS.minConfidence,
      });
    } catch (err) {
      logger.error("Error during PII classification (table):", err);
    }
  };

  const handleColumnClassification = async () => {
    try {
      await dashboardApiServices.reclassifyWithAi({
        source_id: addDsConfig.sourceId,
        save_to_db: CONSTANTS.saveToDb,
        assigned_by: CONSTANTS.assignedBy,
        min_confidence: CONSTANTS.minConfidence,
      });
    } catch (err) {
      logger.error("Error during PII classification (column):", err);
    }
  };

  const handleFetchIngestionSourceAiSummary = async () => {
    setSummaryError(false);
    setIsSourceAiSummaryLoading(true);
    try {
      const response: SourceAiSummaryResponse = await dashboardApiServices.fetchIngestionAiSummary(addDsConfig?.sourceId);
      setSourceAiSummary(response);
    } catch (err) {
      logger.error("Error fetching AI summary:", err);
      setSummaryError(true);
    } finally {
      setIsSourceAiSummaryLoading(false);
    }
  };

  const handleGenerateBulkDataCards = async () => {
    try {
      await dashboardApiServices.generateBulkSourceDatacards(addDsConfig?.sourceId);
    } catch (err) {
      logger.error("Error during bulk data cards generation:", err);
    }
  };

  const handleNewLog = (log: IngestionLog) => {
    setLogs(prev => [...prev.slice(-100), log]);
    if (log.message.includes("Ingestion job completed") && addDsConfig?.piiApproval) {
      setIsProgressExpanded(false);
    }
  };

  const onCloseReset = (viewIngestedDataset = false) => {
    onClose(viewIngestedDataset);
    setStreamStatus("connecting");
    setIsSourceAiSummaryLoading(false);
    setSourceAiSummary(null);
    setAddDsConfig({});
  };

  return {
    // refs
    scrollRef, mainScrollRef, eventSourceRef,
    // state
    steps, phase, currentStepIdx, completedSteps,
    isThinking, progress, totalSteps, showNotification,
    logs, isComplete, isProgressExpanded, setIsProgressExpanded,
    streamStatus, sourceAiSummary, isSourceAiSummaryLoading,
    summaryError, hasAttemptedPhase2, ingestionStepsCount,
    // store
    addDsConfig,
    // handlers
    appendPostIngestionSteps,
    handleBatchApis,
    handleNewLog,
    onCloseReset,
    handleFetchIngestionSourceAiSummary,
  };
}
