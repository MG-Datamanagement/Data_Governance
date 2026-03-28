"use client";

import { DataErrorFallback, EmptyState } from "@/components/Fallbacks";
import { ComplianceSkeleton } from "@/app/(modules)/compliance/components/ComplianceSkeleton";
import { TabNavigation } from "@/components/ui/TabNavigation";
import { useComplianceData } from "@/hooks/useComplianceData";
import {
  ComplianceHeader,
  ComplianceHealthSection,
  ComplianceIssuesSection,
  ComplianceFrameworksPanel,
} from "@/app/(modules)/compliance/components/sections";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import QuickActionsDropdown from "@/components/ui/QuickActionsDropdown";
import { Button } from "@/components/ui/Button";
import { Download, Play } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import { dashboardApiServices } from "@/services/dashboardApi.service";
import { ComplianceScanPanel } from "@/app/(modules)/compliance/components/ComplianceScanPanel";
import { useAppStore } from "@/store/appStore";
import { logger } from "@/lib/logger";

function ComplianceContent() {
  const { addToast, updateToast } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  
  const handleExportReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = addToast("Exporting compliance report...", "loading");
    try {
      await dashboardApiServices.exportComplianceReport();
      updateToast(toastId, "Report exported successfully", "success");
    } catch (err) {
      logger.error("Failed to export compliance report:", err);
      updateToast(toastId, "Failed to export report. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const { healthQuery, issuesQuery, frameworksQuery, insightsQuery } = useComplianceData();

  const isPageLoading = healthQuery.isLoading;
  const pageError = healthQuery.error;

  const tabs = [
    { id: "overview", name: "Overview", href: "/overview" },
    { id: "compliance", name: "Compliance", href: "/compliance" },
  ];

  const rightActions = (
    <div className={isPageLoading || !!pageError ? "opacity-50 pointer-events-none flex gap-2" : "flex gap-2"}>
      <Button
        variant="primary"
        onClick={() => setIsScanOpen(true)}
        icon={<Play size={16} className="fill-current" />}
        disabled={isPageLoading || !!pageError}
      >
        Run Full Scan
      </Button>
      <Button
        variant="outline"
        onClick={handleExportReport}
        disabled={isExporting || isPageLoading || !!pageError}
        icon={isExporting ? <Spinner size={16} /> : <Download size={16} />}
      >
        {isExporting ? "Exporting..." : "Export Report"}
      </Button>
      <QuickActionsDropdown />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-5">
      <TabNavigation tabs={tabs} activeTabId="compliance" rightAction={rightActions} />
      <ComplianceScanPanel isOpen={isScanOpen} onClose={() => setIsScanOpen(false)} />
      
      {isPageLoading ? (
        <div className="mt-5"><ComplianceSkeleton /></div>
      ) : pageError ? (
        <div className="pt-10">
          <EmptyState 
            title="Compliance Unavailable" 
            description="We couldn't load the compliance health data at this time." 
            action={{ label: "Retry", onClick: () => healthQuery.refetch() }} 
          />
        </div>
      ) : (
        <>
          <ComplianceHeader />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="grid grid-cols-1 gap-5 col-span-8 min-w-0">
              <ComplianceHealthSection healthQuery={healthQuery} insightsQuery={insightsQuery} />
              <ComplianceIssuesSection issuesQuery={issuesQuery} />
            </div>

            <ComplianceFrameworksPanel frameworksQuery={frameworksQuery} />
          </div>
        </>
      )}
    </div>
  );
}

export default function CompliancePage() {
  return (
    <ErrorBoundary>
      <ComplianceContent />
    </ErrorBoundary>
  );
}
