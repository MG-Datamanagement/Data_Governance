"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  dashboardApiServices,
  ClassificationResponse,
  ApiCatalogDetail,
  ApiCatalogDatacard,
} from "@/services/dashboardApi.service";
import { Dataset, ApiTag, ApiColumn } from "@/types";
import dynamic from "next/dynamic";

// ─── Lazy-loaded heavy components (Phase 10.1 / 10.2) ────────────────────────
// ComplianceReportModal: only needed when user clicks "Run Compliance Check"
const ComplianceReportModal = dynamic(
  () => import("@/components/modals/ComplianceReportModal"),
  { ssr: false, loading: () => null },
);
import { formatDateTime, formatIST, formatTimeAgo } from "@/lib/utils";
import { CONSTANTS } from "@/lib/constants";
import DatasetDataCardTab from "@/components/tabs/DatasetDataCardTab";
import DatasetColumnsTab from "@/components/tabs/DatasetColumnsTab";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  useGetCatalogDetail,
  useGetCatalogDatacard,
  useGetDatasetComplianceReport,
  useGetCatalogProperties,
  useGetCatalogAuditTrail,
  useGetDatasourceQueries,
  useGetLineageCentric
} from "@/hooks/useDashboardQueries";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, SparkleIcon, FileQuestion, Home, ChevronRight, Table2, Database, LayoutGrid, Sparkles, MoreHorizontal } from "lucide-react";
import { TabNavigation } from "@/components/ui/TabNavigation";
import { InlineState } from "@/components/ui/InlineState";

// DatasetLineage: heavy SVG + positioning engine — only needed on Lineage tab
const DatasetLineage = dynamic(
  () => import("@/components/lineage/DatasetLineage"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px] animate-pulse">
        <div className="space-y-3 w-full max-w-2xl px-6">
          <div className="flex justify-center gap-8 mb-6">
            {[0,1,2].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-32 h-20 bg-gray-100 rounded-xl" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="h-0.5 w-full bg-gray-100 rounded" />
          <div className="flex justify-center"><div className="h-3 w-32 bg-gray-100 rounded" /></div>
        </div>
      </div>
    ),
  },
);
import DatasetQueriesTab from "@/components/tabs/DatasetQueriesTab";
import DatasetDetailSidebar from "@/components/datasets/DatasetDetailSidebar";
import DatasetAuditTab from "@/components/tabs/DatasetAuditTab";
import DatasetPropertiesTab from "@/components/tabs/DatasetPropertiesTab";
import { ReclassificationActionWithAiRequest } from "@/services/dashboardApi.service";
import { ComplianceApiResponse, datasourceApiServices } from "@/services/datasourceApi.service";
import { useAppStore } from "@/store/appStore";
import { SearchInput } from "@/components/ui/SearchInput";
const TABS = [
  "DataCard",
  "Columns",
  "Lineage",
  "Properties",
  "Queries",
  "Audit"
  // "Stats",
  // "Quality",
  // "Governance",
  // "Incidents",
] as const;
type Tab = (typeof TABS)[number];

interface DatasetDetailPageProps {
  params: { sourceId: string; datasetId: string };
}

const DatasetDetailPage: React.FC<DatasetDetailPageProps> = ({
  params: { sourceId, datasetId },
}) => {
  const router = useRouter();
  const { data: catalogData, isLoading: isCatalogLoading, refetch: fetchCatalogDetail } = useGetCatalogDetail(datasetId);
  const { data: datacardData, isLoading: isDatacardLoading } = useGetCatalogDatacard(datasetId);
  const { setSidebarCollapsed } = useAppStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeTab = (searchParams.get("tab") as Tab) || "DataCard";

  const setDatasetDetailTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data: propertiesData } = useGetCatalogProperties(datasetId, { enabled: !!datasetId && activeTab === "Properties" });
  const { data: auditData } = useGetCatalogAuditTrail(datasetId, 50, 0, { enabled: !!datasetId && activeTab === "Audit" });
  const { data: queriesData } = useGetDatasourceQueries(datasetId, { enabled: !!datasetId && activeTab === "Queries" });

  // Pre-fetch lineage data proactively with default depth (2) so it's ready when the user opens the Lineage tab
  useGetLineageCentric(datasetId, 2);

  const isLoading = isCatalogLoading || isDatacardLoading;

  // using appStore for activeTab
  const [showCompliance, setShowCompliance] = useState(false);

  const { data: complianceData, isFetching: isComplianceLoading, refetch: complianceRefetch } = useGetDatasetComplianceReport(datasetId);

  const handleViewCompliance = async () => {
    setShowCompliance(true);
    complianceRefetch();
  };

  const detail = useMemo(() => {
    if (!catalogData) return null;
    const ownerName =
      typeof catalogData.owner === "string"
        ? catalogData.owner
        : (catalogData?.owner as any)?.name || "Unknown";
    return {
      id: catalogData.id,
      sourceId: sourceId,
      sourceName: catalogData.source_name,
      name: catalogData.table_name,
      type: catalogData.source_type
        ? catalogData.source_type.charAt(0).toUpperCase() +
        catalogData.source_type.slice(1)
        : "Dataset",
      overview:
        catalogData.description ||
        `The ${catalogData.table_name} dataset contains structured records ingested from ${catalogData.source_name}. It belongs to the ${catalogData.schema_name} schema within the ${catalogData.database_name} database.`,
      keyFields: catalogData.columns?.map((c: ApiColumn) => ({
        name: c.name,
        description: c.comment || "Column metadata",
      })),
      freshness: formatTimeAgo(catalogData?.updated_at),
      volume:
        catalogData.row_count !== null
          ? `${catalogData.row_count.toLocaleString()}K`
          : "—",
      qualityScore: "95%",
      columnCount: catalogData.column_count || 0,
      owner: ownerName,
      ownerInitials: ownerName.slice(0, 2).toUpperCase(),
      tags: catalogData.tags || [],
      lineageWarning: undefined,
      dataCardContent: datacardData?.data_card,
    };
  }, [catalogData, datacardData, sourceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Global search bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-lg">
              <SearchInput
                placeholder="Find tables, dashboards, people, and more"
                disabled
                showKbd
              />
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-6 animate-pulse" />
          {/* Dataset card skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 mb-3 flex gap-4">
            {/* Left skeleton */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-gray-100 rounded-xl h-48 animate-pulse" />
              <div className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            </div>
            {/* Right sidebar skeleton */}
            <div className="w-64 flex-shrink-0 bg-gray-100 rounded-xl h-96 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold">Dataset not found</p>
          <p className="text-gray-400 text-sm mt-1">
            The dataset &quot;{datasetId}&quot; was not found or failed to load.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 text-sm hover:underline"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const tabs = TABS.map((tab) => {
    let count: number | undefined;
    if (tab === "Columns") count = catalogData?.columns?.length || 0;
    if (tab === "Properties") count = propertiesData?.custom_properties?.length || 0;
    if (tab === "Audit") count = auditData?.total_log_count || 0;
    if (tab === "Queries") count = queriesData?.user_queries?.length || 0;
    
    return { name: tab, count };
  });

  const qualityColor =
    detail.qualityScore === "N/A"
      ? "text-gray-400"
      : parseInt(detail.qualityScore) >= 90
        ? "text-green-600"
        : "text-yellow-600";

  const handleTabClick = (tab: Tab) => {
    setDatasetDetailTab(tab as any);
    if (tab === "Lineage") {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Compliance Report Modal */}
      {showCompliance && (
        <ComplianceReportModal
          datasetName={detail.name}
          onClose={() => setShowCompliance(false)}
          complianceData={complianceData}
          refetchCatalogDetails={fetchCatalogDetail}
        />
      )}

      {/* Global search bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-lg">
            <SearchInput
              placeholder="Find tables, dashboards, people, and more"
              showKbd
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <button
            onClick={() => router.push("/")}
            className="hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
          <ChevronRight className="w-4 h-4" />
          <a
            href="/data-sources"
            className="hover:text-gray-600 transition-colors"
          >
            Data Sources
          </a>
          <ChevronRight className="w-4 h-4" />
          <a
            href={`/data-sources/${sourceId}/datasets`}
            className="hover:text-gray-600 transition-colors"
          >
            {detail.sourceName || sourceId}
          </a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{detail.name}</span>
        </nav>

        {/* Dataset card header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 mb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {detail.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    {detail.type}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    {detail.sourceName || sourceId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewCompliance}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                View Compliance Report
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" aria-label="More options">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <TabNavigation
            tabs={tabs.map(({ name, count }) => ({
              id: name,
              name: (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {name === "DataCard" && (
                    <SparkleIcon
                      className={cn(activeTab === name ? "text-indigo-600 fill-indigo-600" : "text-gray-500 fill-gray-500")}
                      strokeWidth={1}
                      size={14}
                    />
                  )}
                  {name}
                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${activeTab === name
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {count}
                    </span>
                  )}
                </div>
              ),
            }))}
            activeTabId={activeTab}
            onTabChange={(id: string) => handleTabClick(id as Tab)}
            className="mt-5 border-none mb-0"
            tabClassName="mx-1"
          />
        </div>

        {/* Tab Body Container */}
        <div className="flex gap-4 mt-2">
          <div className="flex-1 min-w-0">
            {activeTab === "DataCard" && (
              <QueryErrorBoundary label="DataCard Summary">
                <DatasetDataCardTab detail={detail} />
              </QueryErrorBoundary>
            )}
            {activeTab === "Columns" && (
              <QueryErrorBoundary label="Columns Mapping">
                <DatasetColumnsTab catalogData={catalogData} datasetId={datasetId} />
              </QueryErrorBoundary>
            )}
            {activeTab === "Lineage" && (
              <QueryErrorBoundary label="Data Lineage Graph">
                <div
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  style={{ height: "600px" }}
                >
                  <DatasetLineage datasetId={datasetId} datasetName={detail.name} />
                </div>
              </QueryErrorBoundary>
            )}
            {activeTab === "Properties" && (
              <QueryErrorBoundary label="Extended Properties">
                <DatasetPropertiesTab catalogId={datasetId} />
              </QueryErrorBoundary>
            )}
            {activeTab === "Queries" && (
              <QueryErrorBoundary label="Dataset Queries">
                <DatasetQueriesTab catalogId={datasetId} datasetName={catalogData?.table_name || ""} />
              </QueryErrorBoundary>
            )}
            {activeTab === "Audit" && (
              <QueryErrorBoundary label="Audit Trail">
                <DatasetAuditTab catalogId={datasetId} />
              </QueryErrorBoundary>
            )}
            {activeTab !== "DataCard" &&
              activeTab !== "Columns" &&
              activeTab !== "Lineage" &&
              activeTab !== "Properties" &&
              activeTab !== "Queries" &&
              activeTab !== "Audit" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 flex justify-center">
                  <InlineState type="empty" message={`${activeTab} — coming soon`} />
                </div>
              )}
          </div>

          {activeTab !== "Lineage" && (
            <DatasetDetailSidebar
              name={detail.name}
              type={detail.type}
              sourceName={detail.sourceName}
              owner={detail.owner}
              ownerInitials={detail.ownerInitials}
              tags={detail.tags}
              lineageWarning={detail.lineageWarning}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default DatasetDetailPage;

