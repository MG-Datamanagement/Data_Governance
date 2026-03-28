"use client";

import { LoadingFallback, DataErrorFallback } from "@/components/Fallbacks";
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
import { dashboardApiServices } from "@/services/dashboardApiServices";
import { ComplianceScanPanel } from "@/app/(modules)/compliance/components/ComplianceScanPanel";
import { useAppStore } from "@/store/appStore";

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
      console.error("Failed to export compliance report:", err);
      updateToast(toastId, "Failed to export report. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const { healthQuery, issuesQuery, frameworksQuery, insightsQuery } = useComplianceData();

  const isPageLoading = healthQuery.isLoading;
  const pageError = healthQuery.error;

  if (isPageLoading) return <LoadingFallback />;
  if (pageError)
    return (
      <DataErrorFallback
        retry={() => healthQuery.refetch()}
      />
    );

  const tabs = [
    { id: "overview", name: "Overview", href: "/overview" },
    { id: "compliance", name: "Compliance", href: "/compliance" },
  ];

  const rightActions = (
    <>
      <Button
        variant="primary"
        onClick={() => setIsScanOpen(true)}
        icon={<Play size={16} className="fill-current" />}
      >
        Run Full Scan
      </Button>
      <Button
        variant="outline"
        onClick={handleExportReport}
        disabled={isExporting}
        icon={isExporting ? <Spinner size={16} /> : <Download size={16} />}
      >
        {isExporting ? "Exporting..." : "Export Report"}
      </Button>
      <QuickActionsDropdown />
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-5">
      <TabNavigation tabs={tabs} activeTabId="compliance" rightAction={rightActions} />
      <ComplianceScanPanel isOpen={isScanOpen} onClose={() => setIsScanOpen(false)} />
      <ComplianceHeader />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="grid grid-cols-1 gap-5 col-span-8 min-w-0">
          <ComplianceHealthSection healthQuery={healthQuery} insightsQuery={insightsQuery} />
          <ComplianceIssuesSection issuesQuery={issuesQuery} />
        </div>

        <ComplianceFrameworksPanel frameworksQuery={frameworksQuery} />
      </div>
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
