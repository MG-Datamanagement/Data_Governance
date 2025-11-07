import { Connector } from "../../types/types";
import { ConnectorApiResponse, CreateConnectorRequest } from "../../types/types";

export const normalizeConnectorFromApi = (
  apiConnector: ConnectorApiResponse,
  connectorName?: string,
  connectorType?: string,
  category?: string
): Connector => {
  return {
    id: apiConnector.connector_id,
    name: connectorName || `${apiConnector.source} - ${apiConnector.database}`,
    type: connectorType || apiConnector.source.toUpperCase(),
    source: apiConnector.source,
    category: (category as any) || "database",
    status: apiConnector.status as any,
    lastSync: apiConnector.last_sync,
    lastUpdated: new Date(apiConnector.updated_at || apiConnector.created_at)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    recordsProcessed: apiConnector.records_processed || 0,
    errorCount: apiConnector.error_count || 0,
    config: {
      source: apiConnector.source,
      host: apiConnector.host,
      port: apiConnector.port.toString(),
      database: apiConnector.database,
      username: apiConnector.username,
      ssl: apiConnector.ssl_mode !== null && apiConnector.ssl_mode !== "",
      ssl_mode: apiConnector.ssl_mode,
      ssh_tunnel_method: apiConnector.ssh_tunnel_method,
      cdc_method: apiConnector.cdc_method,
      data_cleaning_enabled: apiConnector.data_cleaning_enabled,
      deduplication: apiConnector.deduplication,
    },
    tables: apiConnector.tables || [],
    tags: apiConnector.tags || [],
    schedule: apiConnector.schedule || "manual",
  };
};

export const normalizeConnectorToApi = (
  formData: any,
  connectorType: string
): CreateConnectorRequest => {
    console.log(formData)
  return {
    source: connectorType.toLowerCase(),
    host: formData.host,
    port: parseInt(formData.port),
    database: formData.database,
    username: formData.username,
    password: formData.password,
    ssl_mode: formData.ssl_mode || null,
    ssh_tunnel_method: formData.ssh_tunnel_method || null,
    cdc_method: formData.cdc_method || "cdc",
    data_cleaning_enabled: formData.data_cleaning_enabled || "yes",
    deduplication: formData.deduplication || "yes",
  };
};

export const normalizeConnectorUpdateToApi = (
  formData: any
): Partial<CreateConnectorRequest> => {
  const updateData: any = {};

  if (formData.host) updateData.host = formData.host;
  if (formData.port) updateData.port = parseInt(formData.port);
  if (formData.database) updateData.database = formData.database;
  if (formData.username) updateData.username = formData.username;
  if (formData.password) updateData.password = formData.password;
  if (formData.ssl_mode !== undefined)
    updateData.ssl_mode = formData.ssl_mode || null;
  if (formData.ssh_tunnel_method !== undefined)
    updateData.ssh_tunnel_method = formData.ssh_tunnel_method || null;
  if (formData.cdc_method) updateData.cdc_method = formData.cdc_method;
  if (formData.data_cleaning_enabled)
    updateData.data_cleaning_enabled = formData.data_cleaning_enabled;
  if (formData.deduplication) updateData.deduplication = formData.deduplication;

  return updateData;
};

export const normalizeSourceType = (type: string): string => {
  const normalized = type.toLowerCase();
  if (normalized === 'postgresql') return 'postgres';
  if (normalized === 'mongodb') return 'mongo';
  return normalized;
};