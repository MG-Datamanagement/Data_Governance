import { QualityRulesResponse } from "@/app/quality/page";
import { ShieldCheck, X, Loader2, ChevronRight } from "lucide-react";
import { useEffect } from "react";

interface ManageRulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rules: QualityRulesResponse | undefined;
  isLoading: boolean;
}

const ManageRulesDrawer: React.FC<ManageRulesDrawerProps> = ({
  isOpen,
  onClose,
  rules,
  isLoading,
}: ManageRulesDrawerProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity !m-0"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto !m-0">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Manage Rules
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Total Rules:{" "}
                  <span className="font-semibold">{rules?.count || 0}</span>
                </p>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {rules?.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {rule.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Table:{" "}
                          <span className="font-medium">{rule.table_name}</span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : rule.severity === "high"
                              ? "bg-orange-100 text-orange-800"
                              : rule.severity === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>
                    {/* <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500">ID: {rule.id}</span>
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
                        View Details
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </button>
                    </div> */}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageRulesDrawer;
