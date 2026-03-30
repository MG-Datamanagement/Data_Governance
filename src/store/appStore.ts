import { create } from "zustand";

export type DatasetDetailTabType = "DataCard" | "Columns" | "Lineage" | "Properties" | "Queries" | "Audit";
export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface AppToast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface AppState {
  /** Left navigation sidebar (global, persists across all pages) */
  sidebarCollapsed: boolean;
  /** Ask-Me-Anything chatbot sidebar (global, persists across navigations) */
  chatSidebarCollapsed: boolean;
  /** Dataset Detail right metadata sidebar (global, persists across navigations) */
  datasetDetailSidebarCollapsed: boolean;
  /** Compliance Frameworks right sidebar (global, persists across navigations) */
  complianceSidebarCollapsed: boolean;
  /** Dark mode */
  darkMode: boolean;
  /** Dataset detail tab */
  datasetDetailTab: DatasetDetailTabType;
  /** Add dataset configuration */
  addDsConfig: Record<string, any>;
  /** Global toast notifications */
  toasts: AppToast[];

  setDatasetDetailTab: (tab: DatasetDetailTabType) => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  toggleChatSidebar: () => void;
  setChatSidebarCollapsed: (collapsed: boolean) => void;

  toggleDatasetDetailSidebar: () => void;
  setDatasetDetailSidebarCollapsed: (collapsed: boolean) => void;

  toggleComplianceSidebar: () => void;
  setComplianceSidebarCollapsed: (collapsed: boolean) => void;

  toggleDarkMode: () => void;
  setAddDsConfig: (config: Record<string, any>) => void;
  
  addToast: (message: string, type: ToastType, duration?: number) => string;
  updateToast: (id: string, message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: true,
  chatSidebarCollapsed: true,
  datasetDetailSidebarCollapsed: false,
  complianceSidebarCollapsed: false,
  darkMode: false,
  datasetDetailTab: "DataCard",
  addDsConfig: {},
  toasts: [],

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

  toggleComplianceSidebar: () =>
    set((state) => ({ complianceSidebarCollapsed: !state.complianceSidebarCollapsed })),
  setComplianceSidebarCollapsed: (collapsed) =>
    set({ complianceSidebarCollapsed: collapsed }),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setAddDsConfig: (config: Record<string, any>) =>
    set({ addDsConfig: { ...config } }),

  addToast: (message, type, duration) => {
    const id = Math.random().toString(36).substring(2, 9);
    const defaultDuration = type === "loading" ? 0 : 3000;
    const finalDuration = duration !== undefined ? duration : defaultDuration;
    
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration: finalDuration }] }));
    
    if (finalDuration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, finalDuration);
    }
    return id;
  },
  
  updateToast: (id, message, type, duration) => {
    const defaultDuration = type === "loading" ? 0 : 3000;
    const finalDuration = duration !== undefined ? duration : defaultDuration;
    
    set((state) => ({
      toasts: state.toasts.map((t) => 
        t.id === id ? { ...t, message, type, duration: finalDuration } : t
      )
    }));
    
    if (finalDuration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, finalDuration);
    }
  },
  
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
