import { useCallback } from "react";
import toast from "react-hot-toast";
import { NotificationType } from "../types/types";

export const useNotifications = () => {
  const addNotification = useCallback(
    (type: NotificationType["type"], message: string) => {
      switch (type) {
        case "success":
          toast.success(message);
          break;
        case "error":
          toast.error(message);
          break;
        case "warning":
          toast(message, { icon: "⚠️" });
          break;
        case "info":
          toast(message, { icon: "ℹ️" });
          break;
      }
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  return {
    notifications: [],
    addNotification,
    dismissNotification,
  };
};
