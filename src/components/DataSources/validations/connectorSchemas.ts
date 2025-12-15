
import { z } from "zod";

export const connectorBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Connection name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),

  host: z
    .string()
    .min(1, "Host is required")
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$|^localhost$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      "Invalid host format"
    ),

  port: z
    .string()
    .min(1, "Port is required")
    .regex(/^\d+$/, "Port must be a number")
    .refine((val) => {
      const num = parseInt(val);
      return num >= 1 && num <= 65535;
    }, "Port must be between 1 and 65535"),

  database: z
    .string()
    .min(1, "Database name is required")
    .min(2, "Database name must be at least 2 characters")
    .max(64, "Database name must be less than 64 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Database name can only contain letters, numbers, and underscores"
    ),

  username: z
    .string()
    .min(1, "Username is required")
    .min(2, "Username must be at least 2 characters")
    .max(64, "Username must be less than 64 characters"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(4, "Password must be at least 4 characters")
    .max(128, "Password must be less than 128 characters"),
});

export const connectorAdvancedSchema = connectorBaseSchema.extend({
  ssl_mode: z.enum(["", "require", "verify-ca", "verify-full"]).nullable(),
  ssh_tunnel_method: z.enum(["", "password", "key"]).nullable(),
  cdc_method: z.enum(["cdc", "full_load"], {
    required_error: "CDC method is required",
  }),
  data_cleaning_enabled: z.enum(["yes", "no"], {
    required_error: "Data cleaning option is required",
  }),
  deduplication: z.enum(["yes", "no"], {
    required_error: "Deduplication option is required",
  }),
  tags: z.array(z.string()).optional().default([]),
  schedule: z.string().optional().default("manual"),
});

export type ConnectorFormData = z.infer<typeof connectorAdvancedSchema>;

export const connectorEditSchema = connectorAdvancedSchema.partial();
export type ConnectorEditFormData = z.infer<typeof connectorEditSchema>;
