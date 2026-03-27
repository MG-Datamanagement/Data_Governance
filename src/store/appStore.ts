import { create } from "zustand";

export type DashboardTabType = "Overview" | "Compliance";
export type ActivityTabType = "recent" | "viewed";
export type DatasetDetailTabType = "DataCard" | "Columns" | "Lineage" | "Properties" | "Queries" | "Audit";
export type ToastType = "success" | "error" | "info" | "warning";

export interface AppToast {
  id: string;
  message: string;
  type: ToastType;
}

interface AppState {
  /** Left navigation sidebar (global, persists across all pages) */
  sidebarCollapsed: boolean;
  /** Ask-Me-Anything chatbot sidebar (global, persists across navigations) */
  chatSidebarCollapsed: boolean;
  /** Dataset Detail right metadata sidebar (global, persists across navigations) */
  datasetDetailSidebarCollapsed: boolean;
  /** Dark mode */
  darkMode: boolean;
  /** Activity tab */
  activityTab: ActivityTabType;
  /** Dashboard tab */
  dashboardTab: DashboardTabType;
  /** Dataset detail tab */
  datasetDetailTab: DatasetDetailTabType;
  /** Add dataset configuration */
  addDsConfig: Record<string, any>;
  /** Global toast notifications */
  toasts: AppToast[];

  setDashboardTab: (tab: DashboardTabType) => void;
  setActivityTab: (tab: ActivityTabType) => void;
  setDatasetDetailTab: (tab: DatasetDetailTabType) => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  toggleChatSidebar: () => void;
  setChatSidebarCollapsed: (collapsed: boolean) => void;

  toggleDatasetDetailSidebar: () => void;
  setDatasetDetailSidebarCollapsed: (collapsed: boolean) => void;

  toggleDarkMode: () => void;
  setAddDsConfig: (config: Record<string, any>) => void;
  
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: true,
  chatSidebarCollapsed: true,
  datasetDetailSidebarCollapsed: false,
  darkMode: false,
  dashboardTab: "Overview",
  activityTab: "recent",
  datasetDetailTab: "DataCard",
  addDsConfig: {},
  toasts: [],

  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  setActivityTab: (tab) => set({ activityTab: tab }),
  setDatasetDetailTab: (tab) => set({ datasetDetailTab: tab }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toggleChatSidebar: () =>
    set((state) => ({ chatSidebarCollapsed: !state.chatSidebarCollapsed })),
  setChatSidebarCollapsed: (collapsed) =>
    set({ chatSidebarCollapsed: collapsed }),

  toggleDatasetDetailSidebar: () =>
    set((state) => ({ datasetDetailSidebarCollapsed: !state.datasetDetailSidebarCollapsed })),
  setDatasetDetailSidebarCollapsed: (collapsed) =>
    set({ datasetDetailSidebarCollapsed: collapsed }),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setAddDsConfig: (config: Record<string, any>) =>
    set({ addDsConfig: { ...config } }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto remove after 3s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
