import { Shield, InfoIcon, Info, Columns } from "lucide-react";
import { InlineState } from "@/components/ui/InlineState";
import { ComplianceFrameworkCard } from "@/app/(modules)/compliance/components/ComplianceFrameworkCard";
import { ComplianceData } from "@/hooks/useComplianceData";
import { ApiComplianceFramework } from "@/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { SidebarToggle } from "@/components/ui/SidebarToggle";


type Props = {
  frameworksQuery: ComplianceData["frameworksQuery"];
};

export function ComplianceFrameworksPanel({ frameworksQuery }: Props) {
  const { data: runData, isLoading, error, refetch } = frameworksQuery;
  const frameworks = runData?.frameworks;
  const { complianceSidebarCollapsed: collapsed, toggleComplianceSidebar: toggle } = useAppStore();

  return (
    <div
      className={cn(
        "flex-shrink-0 bg-white rounded-xl border border-gray-200 border-l-4 border-l-indigo-600 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)] sticky top-6 transition-all duration-300",
        collapsed ? "w-14" : "w-[360px]"
      )}
    >
      {collapsed ? (
        <div className="flex flex-col items-center h-full py-3 px-1 select-none">
          <SidebarToggle
            collapsed={collapsed}
            onToggle={toggle}
            iconSize={20}
            className="w-9 h-9"
          />

          <div className="flex-1 flex items-center justify-center mt-2">
            <span
              className="text-[11px] font-semibold text-gray-400 tracking-[0.2em] uppercase whitespace-nowrap"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Compliance Frameworks
            </span>
          </div>

          <div
            title={`${frameworks?.length ?? 0} frameworks`}
            className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm mt-4 cursor-default group hover:bg-indigo-100 transition-colors"
          >
            <span className="text-xs font-bold text-indigo-600 group-hover:scale-110 transition-transform">
              {frameworks?.length ?? 0}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 border-b border-gray-100 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="text-indigo-600" size={18} />
                <h2 className="text-base font-bold text-gray-900">
                  Compliance Frameworks
                </h2>
              </div>
              <p className="text-xs text-gray-400 font-medium pl-6">
                {frameworks?.length ?? 0} frameworks
              </p>
            </div>
            <SidebarToggle
              collapsed={collapsed}
              onToggle={toggle}
              iconSize={20}
              className="p-1.5 rounded-lg"
            />
          </div>

          <div className="flex-1 grid grid-auto-rows-min gap-2 p-2 overflow-y-auto pr-1">
            {isLoading && (
              <InlineState type="loading" message="Loading compliance frameworks..." />
            )}
            {error && (
              <InlineState type="empty" message="No compliance frameworks configured." onRetry={refetch} />
            )}
            {!isLoading && !error && frameworks?.length === 0 && (
              <InlineState type="empty" message="No compliance frameworks configured." />
            )}
            {!isLoading && !error && frameworks && frameworks.length > 0 &&
              frameworks.map((framework: ApiComplianceFramework) => (
                <ComplianceFrameworkCard key={framework.name} framework={framework} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
