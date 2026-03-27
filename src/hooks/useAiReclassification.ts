import { useState } from "react";
import { dashboardApiServices, ReclassificationActionWithAiRequest } from "@/services/dashboardApiServices";
import { CONSTANTS } from "@/lib/constants";
import { ClassifyScanPhase } from "@/types/datasourcesTypes";

export function useAiReclassification(datasetId: string) {
  const [isReclassifyAiLoading, setIsReclassifyAiLoading] = useState(false);
  const [reclassifyAiScanPhase, setReclassifyAiScanPhase] = useState<ClassifyScanPhase>("never");
  const [aiResults, setAiResults] = useState<any>({});

  const handleReclassificationActionWithAI = async () => {
    setIsReclassifyAiLoading(true);
    setReclassifyAiScanPhase("scanning");

    try {
      const payload: ReclassificationActionWithAiRequest = {
        catalog_id: datasetId,
        save_to_db: CONSTANTS.saveToDb,
        assigned_by: CONSTANTS.assignedBy,
        min_confidence: 0.7,
      };

      const response: any = await dashboardApiServices.reclassificationActionWithAi(payload);

      const map: any = {};
      response?.results?.forEach((r: any) => {
        map[r.column_name] = ["pii", "phi"].includes(r) ? "pii" : r;
      });

      setAiResults(map);
      setReclassifyAiScanPhase("complete");
    } catch (err) {
      console.error("Error during AI reclassification:", err);
      setReclassifyAiScanPhase("never");
    } finally {
      setIsReclassifyAiLoading(false);
    }
  };

  return {
    isReclassifyAiLoading,
    reclassifyAiScanPhase,
    setReclassifyAiScanPhase,
    aiResults,
    handleReclassificationActionWithAI
  };
}
