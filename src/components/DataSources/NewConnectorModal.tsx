import {
  X,
  Cloud,
  EyeOff,
  Eye,
  Loader,
  Check,
  Server,
  Info,
  Shield,
  RefreshCw,
  Database as DatabaseIcon,
  Sparkles,
} from "lucide-react";
import { memo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DATABASE_TYPES } from "./constants";
import { Connector } from "./types/types";
import { connectorApi } from "./services/connectorApi";
import {
  normalizeConnectorFromApi,
  normalizeConnectorToApi,
} from "./utils/normalizers/connectorNormalizer";
import {
  connectorAdvancedSchema,
  ConnectorFormData,
} from "./validations/connectorSchemas";
import { FormInput } from "../common/FormInput";
import { FormSelect } from "../common/FormSelect";
import { FormToggle } from "../common/FormToggle";
import { useNotifications } from "./hooks/useNotifications";

interface NewConnectorModalProps {
  show: boolean;
  onClose: () => void;
  onCreateConnector: (connector: Connector) => void;
}

const NewConnectorModal: React.FC<NewConnectorModalProps> = memo(
  ({ show, onClose, onCreateConnector }: NewConnectorModalProps) => {
    const [selectedConnectorType, setSelectedConnectorType] =
      useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotifications();

    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
      control,
      setValue,
    } = useForm<ConnectorFormData>({
      resolver: zodResolver(connectorAdvancedSchema),
      defaultValues: {
        name: "",
        host: "",
        port: "",
        database: "",
        username: "",
        password: "",
        ssl_mode: null,
        ssh_tunnel_method: null,
        cdc_method: "cdc",
        data_cleaning_enabled: "yes",
        deduplication: "yes",
        tags: [],
        schedule: "manual",
      },
    });

    const onSubmit = async (data: ConnectorFormData) => {
      setIsSaving(true);
      console.log(data, selectedConnectorType);
      try {
        console.log("📡 Calling API...");
        const apiRequest = normalizeConnectorToApi(
          data,
          selectedConnectorType.id
        );
        const apiResponse = await connectorApi.create(apiRequest);
        const connector = normalizeConnectorFromApi(
          apiResponse,
          data.name,
          selectedConnectorType.name,
          selectedConnectorType.category
        );

        console.log("✅ API Response:", apiResponse);
        console.log("🔍 About to call addNotification");
        addNotification(
          "success",
          apiResponse.message ||
            `Connector "${connector.name}" created successfully`
        );
        onCreateConnector(connector);
        reset();
        setSelectedConnectorType(null);
        onClose();
      } catch (error: any) {
        // alert(error.message || "Failed to create connector");
        addNotification("error", error.message || error.detail || "Failed to create connector");
      } finally {
        setIsSaving(false);
      }
    };

    const handleClose = () => {
      reset();
      setSelectedConnectorType(null);
      onClose();
    };

    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Connector
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Connect to your data sources with advanced features
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {!selectedConnectorType ? (
            <div className="p-6">
              {["database", "cloud"].map((category) => {
                const categoryDbs = DATABASE_TYPES.filter(
                  (db) => db.category === category
                );
                if (categoryDbs.length === 0) return null;

                return (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                      {category === "database" && <Server size={16} />}
                      {category === "cloud" && <Cloud size={16} />}
                      {category}
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {categoryDbs.map((db) => (
                        <button
                          key={db.id}
                          onClick={() => {
                            setSelectedConnectorType(db);
                            setValue("port", db.defaultPort);
                          }}
                          className={`${db.color} border-2 rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer group`}
                        >
                          <div className="text-3xl mb-2">{db.icon}</div>
                          <div className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                            {db.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {db.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="mb-6 flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                <div className="text-4xl">{selectedConnectorType.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedConnectorType.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConnectorType.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConnectorType(null);
                    reset();
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Change
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Configuration */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DatabaseIcon size={16} />
                    Basic Configuration
                  </h4>
                  <div className="space-y-4">
                    <FormInput
                      label="Connection Name"
                      name="name"
                      placeholder="e.g., Production MySQL"
                      required
                      register={register}
                      error={errors.name}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Host"
                        name="host"
                        placeholder="localhost or db.example.com"
                        required
                        register={register}
                        error={errors.host}
                      />
                      <FormInput
                        label="Port"
                        name="port"
                        placeholder={selectedConnectorType.defaultPort}
                        required
                        register={register}
                        error={errors.port}
                      />
                    </div>

                    <FormInput
                      label="Database Name"
                      name="database"
                      placeholder="my_database"
                      required
                      register={register}
                      error={errors.database}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Username"
                        name="username"
                        placeholder="admin"
                        required
                        register={register}
                        error={errors.username}
                      />
                      <FormInput
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        register={register}
                        error={errors.password}
                        rightElement={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield size={16} />
                    Security Settings
                  </h4>
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Data Sync Options */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <RefreshCw size={16} />
                    Data Sync Options
                  </h4>
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Data Quality Options */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles size={16} />
                    Data Quality Options
                  </h4>
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
                </div>

                {/* Info Box */}
                {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info
                    size={20}
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">
                      Advanced Features Enabled
                    </div>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>CDC for real-time data synchronization</li>
                      <li>Automatic data cleaning and normalization</li>
                      <li>Intelligent deduplication</li>
                      <li>Enterprise-grade security with SSL/SSH</li>
                    </ul>
                  </div>
                </div> */}
              </div>

              <div className="mt-6 flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConnectorType(null);
                    reset();
                  }}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Create Connector
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
);

export default NewConnectorModal;
NewConnectorModal.displayName = "NewConnectorModal";
