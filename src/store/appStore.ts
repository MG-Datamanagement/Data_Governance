import { create } from "zustand";

export type DashboardTabType = "Overview" | "Compliance";
export type ActivityTabType = "recent" | "viewed";

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
  /** Add dataset configuration */
  addDsConfig: Record<string, any>;

  setDashboardTab: (tab: DashboardTabType) => void;
  setActivityTab: (tab: ActivityTabType) => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  toggleChatSidebar: () => void;
  setChatSidebarCollapsed: (collapsed: boolean) => void;

  toggleDatasetDetailSidebar: () => void;
  setDatasetDetailSidebarCollapsed: (collapsed: boolean) => void;

  toggleDarkMode: () => void;
  setAddDsConfig: (config: Record<string, any>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: true,
  chatSidebarCollapsed: true,
  datasetDetailSidebarCollapsed: false,
  darkMode: false,
  dashboardTab: "Overview",
  activityTab: "recent",
  addDsConfig: {},

  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  setActivityTab: (tab) => set({ activityTab: tab }),

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
}));
