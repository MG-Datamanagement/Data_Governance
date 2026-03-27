"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  dashboardApiServices,
  ClassificationResponse,
  ApiCatalogDetail,
  ApiCatalogDatacard,
} from "@/services/dashboardApiServices";
import { Dataset, ApiTag, ApiColumn } from "@/types";
import ComplianceReportModal from "@/app/(data-connectors)/components/ComplianceReportModal";
import { formatDateTime, formatIST } from "@/lib/utils";
import { CONSTANTS } from "@/lib/constants";
import DatasetDataCardTab from "./DatasetDataCardTab";
import DatasetColumnsTab from "./DatasetColumnsTab";
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
import { CheckCircle2, Loader2, SparkleIcon } from "lucide-react";
import DatasetLineage from "@/app/(data-connectors)/components/DatasetLineage";
import DatasetQueriesTab from "./DatasetQueriesTab";
import DatasetDetailSidebar from "./DatasetDetailSidebar";
import DatasetAuditTab from "./DatasetAuditTab";
import DatasetPropertiesTab from "./DatasetPropertiesTab";
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
  sourceId: string;
  datasetId: string;
}

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ReclassificationActionWithAiRequest } from "@/services/dashboardApiServices";
import { ComplianceApiResponse, datasourceApiServices } from "@/services/datasourceApiServices";
import { useAppStore } from "@/store/appStore";

const DatasetDetailPage: React.FC<DatasetDetailPageProps> = ({
  sourceId,
  datasetId,
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
      keyFields: catalogData.columns?.map((c: any) => ({
        name: c.name,
        description: c.comment || "Column metadata",
      })),
      freshness: formatIST(catalogData.updated_at),
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
            <div className="relative max-w-lg">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Find tables, dashboards, people, and more"
                className="pl-9 pr-16 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                  ⌘
                </kbd>
                <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                  K
                </kbd>
              </span>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-6 animate-pulse" />
          {/* Dataset card skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 mb-5 flex gap-4">
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
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
              />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">Dataset not found</p>
          <p className="text-gray-400 text-sm mt-1">
            The dataset "{datasetId}" was not found or failed to load.
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
          <div className="relative max-w-lg">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Find tables, dashboards, people, and more"
              className="pl-9 pr-16 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                ⌘
              </kbd>
              <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5">
                K
              </kbd>
            </span>
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
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Home
          </button>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <a
            href="/data-sources"
            className="hover:text-gray-600 transition-colors"
          >
            Data Sources
          </a>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <a
            href={`/data-sources/${sourceId}/datasets`}
            className="hover:text-gray-600 transition-colors"
          >
            {detail.sourceName || sourceId}
          </a>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-700 font-medium">{detail.name}</span>
        </nav>

        {/* Dataset card header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 mb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {detail.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {detail.type}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                      />
                    </svg>
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
                <svg
                  className="w-4 h-4 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                View Compliance Report
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200 mt-5">
            {tabs.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => handleTabClick(name)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === name
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {name === "DataCard" && <SparkleIcon className={cn(activeTab === name ? "text-indigo-600 fill-indigo-600" : "text-gray-500 fill-gray-500")} strokeWidth={1} size={14} />}
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
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body Container */}
        <div className="flex gap-4 mt-5">
          <div className="flex-1 min-w-0">
            {activeTab === "DataCard" && <DatasetDataCardTab detail={detail} />}
            {activeTab === "Columns" && (
              <DatasetColumnsTab catalogData={catalogData} datasetId={datasetId} />
            )}
            {activeTab === "Lineage" && (
              <div
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                style={{ height: "600px" }}
              >
                <DatasetLineage datasetId={datasetId} datasetName={detail.name} />
              </div>
            )}
            {activeTab === "Properties" && (
              <DatasetPropertiesTab catalogId={datasetId} />
            )}
            {activeTab === "Queries" && (
              <DatasetQueriesTab catalogId={datasetId} datasetName={catalogData?.table_name || ""} />
            )}
            {activeTab === "Audit" && (
              <DatasetAuditTab catalogId={datasetId} />
            )}
            {activeTab !== "DataCard" &&
              activeTab !== "Columns" &&
              activeTab !== "Lineage" &&
              activeTab !== "Properties" &&
              activeTab !== "Queries" &&
              activeTab !== "Audit" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {activeTab} — coming soon
                  </p>
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

