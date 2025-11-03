import { Database, Terminal } from "lucide-react";
import { memo } from "react";
import { ScreensEnum } from "./constants";
import { NavigationItem } from "./types/types";

interface NavigationProps {
  currentScreen: string;
  onScreenChange: (screen: ScreensEnum) => void;
}

export const NavigationConfig: NavigationItem[] = [
  {
    id: ScreensEnum.connectors,
    name: "Connectors",
    icon: Database,
    label: "Connectors",
  },
  {
    id: ScreensEnum.query,
    name: "Query Engine",
    icon: Terminal,
    label: "Query",
  },
];

const Navigation: React.FC<NavigationProps> = memo(
  ({
    currentScreen,
    onScreenChange,
  }: {
    currentScreen: string;
    onScreenChange: (screen: ScreensEnum) => void;
  }) => (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-2">
        <div className="flex items-center justify-center">
          <div className="flex gap-4">
            {NavigationConfig.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onScreenChange(id)}
                className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                  currentScreen === id
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
);

export default Navigation;

Navigation.displayName = "Navigation";
