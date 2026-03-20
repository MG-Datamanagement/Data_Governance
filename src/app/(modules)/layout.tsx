"use client";

// import { useSession } from "next-auth/react"; // disconnected — connect when auth is ready
// import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { MOCK_USER } from "@/lib/mockData";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { data: session, status } = useSession(); // disconnected — connect when auth is ready
  const { sidebarCollapsed } = useAppStore();

  // if (status === "loading") {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-gray-600">Loading...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb]">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-0" : "ml-0",
        )}
      >
        <Header userName={MOCK_USER.name} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
