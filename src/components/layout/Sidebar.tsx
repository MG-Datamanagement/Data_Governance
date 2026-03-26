"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
// import { signOut, useSession } from "next-auth/react"; // disconnected — connect when auth is ready
import {
  Home,
  Tag,
  Database,
  Settings,
  LogOut,
  Moon,
  ChevronLeft,
  ChevronRight,
  Bot,
  Building2
} from "lucide-react";
import { LuMessageSquare, LuCable, LuSparkles } from "react-icons/lu";
import { GiMicrochip } from "react-icons/gi";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { BrandLogo } from "../ui/BrandLogo";
import { MOCK_USER } from "@/lib/mockData";
import { MD_BREAKPOINT } from "@/lib/constants";

const GOVERN_ITEMS = [
  { icon: Home, label: "Home", href: "/overview" },
  { icon: Database, label: "Data Sources", href: "/data-sources" },
  // { icon: Globe, label: "Domains", href: "/domains" },
  { icon: Tag, label: "Tags", href: "/tags" },
  // { icon: Book, label: "Glossary", href: "/glossary" },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: GiMicrochip, label: "Models", href: "/model" },
  { icon: Building2, label: "Line of Business", href: "/line-of-business" },
];

const ADMIN_ITEMS = [
  { icon: Database, label: "Data Connectors", href: "/data-connectors" },
  // { icon: BarChart3, label: "Analytics", href: "/analytics" },
];

const AI_ASSISTANT_ITEMS = [
  { icon: LuMessageSquare, label: "Ask Me Anything", href: "/ask-me-anything" },
];



export function Sidebar() {
  const pathname = usePathname();
  // const { data: session } = useSession(); // disconnected — connect when auth is ready
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed, darkMode, toggleDarkMode } =
    useAppStore();

  /** Auto-collapse when viewport width is ≤ md breakpoint */
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarCollapsed(e.matches);
    };

    // Run immediately on mount
    handler(mql);

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [setSidebarCollapsed]);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 relative flex-shrink-0",
        sidebarCollapsed ? "w-[70px]" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 text-white bg-gray-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <BrandLogo />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-950 text-sm">
                Infinity
              </span>
              <span className="font-light text-gray-800 text-xs">
                Governance
              </span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 text-white bg-gray-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <BrandLogo />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 z-20 transition-all",
          sidebarCollapsed ? "top-12 left-14" : "top-12 left-[226px]",
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-3">
          {/* Govern */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-1 text-xs font-medium text-gray-500 uppercase">
                Govern
              </h3>
            )}
            <div className="space-y-1">
              {GOVERN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "sidebar-link",
                    pathname === item.href && "active",
                  )}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <item.icon size={16} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>

          {/* Admin */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-1 text-xs font-medium text-gray-500 uppercase">
                Admin
              </h3>
            )}
            <div className="space-y-1">
              {ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "sidebar-link",
                    pathname === item.href && "active",
                  )}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <item.icon size={16} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>

          {/* AI Assistant */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-1 text-xs font-medium text-gray-500 uppercase">
                Ai Assistant
              </h3>
            )}
            <div className="space-y-1">
              {AI_ASSISTANT_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "sidebar-link",
                    pathname === item.href && "active",
                  )}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <item.icon size={16} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <div>
          <button
            onClick={toggleDarkMode}
            className={cn("sidebar-link", sidebarCollapsed ? "" : "w-full")}
            title={sidebarCollapsed ? "Dark Theme" : ""}
          >
            <Moon size={16} />
            {!sidebarCollapsed && <span>Dark Theme</span>}
          </button>
        </div>
        <div>
          <button
            className={cn("sidebar-link", sidebarCollapsed ? "" : "w-full")}
            title={sidebarCollapsed ? "Settings" : ""}
          >
            <Settings size={16} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
        <div>
          <button
            // onClick={() => signOut({ callbackUrl: "/login" })} // disconnected — connect when auth is ready
            className={cn(
              "sidebar-link",
              sidebarCollapsed ? "" : "w-full",
            )}
            title={sidebarCollapsed ? "Sign out" : ""}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* User Profile — using mock user (disconnect auth, connect later) */}
        <div className="pt-2 border-t border-gray-200">
          <div
            className={cn(
              "flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
              sidebarCollapsed ? "justify-center" : "px-2",
            )}
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-indigo-700">
                {getUserInitials(MOCK_USER.name)}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {MOCK_USER.name}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {MOCK_USER.role}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
