import {
  X,
  TableIcon,
  Activity,
  TrendingUp,
  Shield,
  RefreshCw,
  Sparkles,
  Loader,
  Edit2,
  Check,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ALL_INTEGRATIONS } from "./utils/integrations";
import StatusBadge from "./StatusBadge";
import { Connector } from "./types/types";
import { connectorApi } from "./services/connectorApi";
import {
  normalizeConnectorFromApi,
  normalizeConnectorUpdateToApi,
} from "./utils/normalizers/connectorNormalizer";
import {
  connectorEditSchema,
  ConnectorEditFormData,
} from "./validations/connectorSchemas";
import { FormInput } from "../common/FormInput";
import { FormSelect } from "../common/FormSelect";
import { FormToggle } from "../common/FormToggle";
import { useNotifications } from "./hooks/useNotifications";

interface ConnectorDetailsDrawerProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (connector: Connector) => void;
}

const ConnectorDetailsDrawer: React.FC<ConnectorDetailsDrawerProps> = memo(
  ({
    connector: initialConnector,
    isOpen,
    onClose,
    onUpdate,
  }: ConnectorDetailsDrawerProps) => {
    const [connector, setConnector] = useState<Connector | null>(
      initialConnector
    );
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotifications();

    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
      control,
    } = useForm<ConnectorEditFormData>({
      resolver: zodResolver(connectorEditSchema),
    });

    useEffect(() => {
      if (!isOpen || !initialConnector) return;

      console.log("Loading connector details:", initialConnector.name);

      setConnector(initialConnector);
      reset({
        name: initialConnector.name,
        host: initialConnector.config.host || "",
        port: (initialConnector.config.port as any) || "",
        database: initialConnector.config.database || "",
        username: initialConnector.config.username || "",
        ssl_mode: (initialConnector.config.ssl_mode as any) || "",
        ssh_tunnel_method:
          (initialConnector.config.ssh_tunnel_method as any) || "",
        cdc_method: initialConnector.config.cdc_method || "cdc",
        data_cleaning_enabled:
          initialConnector.config.data_cleaning_enabled || "no",
        deduplication: initialConnector.config.deduplication || "no",
      });

      setIsLoading(false);
    }, [isOpen, initialConnector, reset]);

    const fetchConnectorDetails = async (connectorId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const apiResponse = await connectorApi.getById(connectorId);
        const detailedConnector = normalizeConnectorFromApi(
          apiResponse,
          initialConnector?.name,
          initialConnector?.type,
          initialConnector?.category
        );
        setConnector(detailedConnector);

        reset({
          name: detailedConnector.name,
          host: detailedConnector.config.host,
          port: detailedConnector.config.port as any,
          database: detailedConnector.config.database,
          username: detailedConnector.config.username,
          ssl_mode: detailedConnector.config.ssl_mode as any,
          ssh_tunnel_method: detailedConnector.config.ssh_tunnel_method as any,
          cdc_method: detailedConnector.config.cdc_method,
          data_cleaning_enabled: detailedConnector.config.data_cleaning_enabled,
          deduplication: detailedConnector.config.deduplication,
        });
      } catch (error: any) {
        console.error("Failed to fetch connector details:", error);
        setError(error.message || "Failed to fetch connector details");
        addNotification("error", "Failed to load connector details");
      } finally {
        setIsLoading(false);
      }
    };

    const onSubmit = async (data: ConnectorEditFormData) => {
      if (!connector) return;

      setIsSaving(true);
      try {
        const apiRequest = normalizeConnectorUpdateToApi(data);
        const apiResponse = await connectorApi.update(connector.id, apiRequest);
        const updatedConnector = normalizeConnectorFromApi(
          apiResponse,
          data.name,
          connector.type,
          connector.category
        );

        setConnector(updatedConnector);
        onUpdate(updatedConnector);
        setIsEditing(false);
      } catch (error: any) {
        // alert(error.message || "Failed to update connector");
        addNotification("error", error.message || error.detail || "Failed to update connector");
      } finally {
        setIsSaving(false);
      }
    };

    const handleClose = () => {
      setIsEditing(false);
      setError(null);
      reset();
      onClose();
    };

    if (!isOpen || !connector) return null;

    if (isLoading) {
      return (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex items-center justify-center">
            <div className="text-center">
              <Loader
                size={48}
                className="animate-spin text-red-500 mx-auto mb-4"
              />
              <p className="text-gray-600">Loading connector details...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-red-500 mb-4 text-4xl">⚠️</div>
              <p className="text-gray-900 font-semibold mb-2">
                Failed to load connector
              </p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit" : "View"} Connector
              </h2>
              <p className="text-sm text-gray-500 mt-1">{connector.name}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <FormInput
                    label="Connector Name"
                    name="name"
                    register={register}
                    error={errors.name}
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Connector Name
                    </label>
                    <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-900">
                        {connector.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                      <span className="text-lg">
                        {
                          ALL_INTEGRATIONS.find(
                            (integration) => integration.name === connector.type
                          )?.icon
                        }
                      </span>
                      <span className="text-sm text-gray-900">
                        {connector.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                      <StatusBadge status={connector.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Health */}
            {/* <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Connection Health
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Activity size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-900">
                      Connection Active
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      Last health check: 2 minutes ago • Response time: 45ms
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      99.9%
                    </div>
                    <div className="text-xs text-green-700">Uptime</div>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Connection Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Connection Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <FormInput
                        label="Host"
                        name="host"
                        register={register}
                        error={errors.host}
                      />
                      <FormInput
                        label="Port"
                        name="port"
                        register={register}
                        error={errors.port}
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Host
                        </label>
                        <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-900">
                            {connector.config.host}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Port
                        </label>
                        <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-900">
                            {connector.config.port}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <FormInput
                      label="Database"
                      name="database"
                      register={register}
                      error={errors.database}
                    />
                    <FormInput
                      label="Username"
                      name="username"
                      register={register}
                      error={errors.username}
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Database
                      </label>
                      <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-900">
                          {connector.config.database}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-900">
                          {connector.config.username}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Security Configuration */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={16} />
                Security Configuration
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <FormSelect
                      label="SSL Mode"
                      name="ssl_mode"
                      options={[
                        { value: "", label: "No SSL" },
                        { value: "require", label: "Require" },
                        { value: "verify-ca", label: "Verify CA" },
                        { value: "verify-full", label: "Verify Full" },
                      ]}
                      register={register}
                      error={errors.ssl_mode}
                    />
                    <FormSelect
                      label="SSH Tunnel Method"
                      name="ssh_tunnel_method"
                      options={[
                        { value: "", label: "No SSH Tunnel" },
                        { value: "password", label: "SSH Password" },
                        { value: "key", label: "SSH Key" },
                      ]}
                      register={register}
                      error={errors.ssh_tunnel_method}
                    />
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SSL Mode
                      </label>
                      <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-900">
                          {connector.config.ssl_mode || "Not configured"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SSH Tunnel
                      </label>
                      <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-900">
                          {connector.config.ssh_tunnel_method ||
                            "Not configured"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data Sync Configuration */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw size={16} />
                Data Sync Configuration
              </h3>
              {isEditing ? (
                <FormSelect
                  label="CDC Method"
                  name="cdc_method"
                  options={[
                    { value: "cdc", label: "Change Data Capture (CDC)" },
                    { value: "full_load", label: "Full Load" },
                  ]}
                  register={register}
                  error={errors.cdc_method}
                  helpText="CDC captures only changes, Full Load syncs entire dataset"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CDC Method
                  </label>
                  <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        connector.config.cdc_method === "cdc"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {connector.config.cdc_method === "cdc"
                        ? "CDC"
                        : "Full Load"}
                    </span>
                    <span className="text-sm text-gray-600">
                      {connector.config.cdc_method === "cdc"
                        ? "Real-time change capture"
                        : "Complete data sync"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Data Quality Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles size={16} />
                Data Quality Settings
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  <Controller
                    name="data_cleaning_enabled"
                    control={control}
                    render={({ field }) => (
                      <FormToggle
                        label="Data Cleaning"
                        name="data_cleaning_enabled"
                        description="Automatically clean and normalize data during sync"
                        register={register}
                        error={errors.data_cleaning_enabled}
                        value={field.value === "yes"}
                        onChange={(checked) =>
                          field.onChange(checked ? "yes" : "no")
                        }
                      />
                    )}
                  />
                  <Controller
                    name="deduplication"
                    control={control}
                    render={({ field }) => (
                      <FormToggle
                        label="Deduplication"
                        name="deduplication"
                        description="Remove duplicate records automatically"
                        register={register}
                        error={errors.deduplication}
                        value={field.value === "yes"}
                        onChange={(checked) =>
                          field.onChange(checked ? "yes" : "no")
                        }
                      />
                    )}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Data Cleaning
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          connector.config.data_cleaning_enabled === "yes"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {connector.config.data_cleaning_enabled === "yes"
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Automatic data normalization
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Deduplication
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          connector.config.deduplication === "yes"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {connector.config.deduplication === "yes"
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Remove duplicate records
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            {/* <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    Records Processed
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(connector.recordsProcessed || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>+12% this week</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    Error Count
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {connector.errorCount || 0}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      (connector.errorCount || 0) > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {(connector.errorCount || 0) > 0
                      ? "Needs attention"
                      : "All good"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    Last Sync
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {connector.lastSync || "Never"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {connector.schedule || "Manual sync"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    Last Updated
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {connector.lastUpdated}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Configuration modified
                  </div>
                </div>
              </div>
            </div> */}

            {/* Tables */}
            {connector.tables && connector.tables.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Tables ({connector.tables.length})
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {connector.tables.map((table) => (
                      <div
                        key={table}
                        className="text-sm text-gray-700 flex items-center gap-2"
                      >
                        <TableIcon size={14} className="text-gray-400" />
                        {table}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
            {!isEditing ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default ConnectorDetailsDrawer;
ConnectorDetailsDrawer.displayName = "ConnectorDetailsDrawer";
