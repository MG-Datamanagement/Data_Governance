import { AttentionRequiredTableResponse } from "@/app/quality/page";
import { AlertTriangle, X, Loader2, CheckCircle, Database, Link, ChevronRight } from "lucide-react";
import { useEffect } from "react";

interface AttentionTablesDrawerProps { 
  isOpen: boolean; 
  onClose: () => void; 
  tables: AttentionRequiredTableResponse | undefined; 
  isLoading: boolean;
}

const AttentionTablesDrawer:React.FC<AttentionTablesDrawerProps> = ({ 
  isOpen, 
  onClose, 
  tables, 
  isLoading 
}: AttentionTablesDrawerProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto !m-0">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tables Needing Attention</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-orange-600">{tables?.count || 0}</span> tables require immediate attention
                </p>
              </div>

              {/* Tables List */}
              {tables?.count === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">All tables are in good health!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tables?.tables.map((table) => (
                    <div
                      key={table.id}
                      className="p-4 border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Database className="h-5 w-5 text-orange-600" />
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {table.name}
                          </h3>
                        </div>
                        {/* <Link
                          href={`/catalog/${table.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                          View
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Link> */}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Table ID: {table.id}</span>
                        <span>Domain ID: {table.domain_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default AttentionTablesDrawer
