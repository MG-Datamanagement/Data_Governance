"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  ArrowLeft,
  ShieldAlert,
  Database,
  ShieldCheck,
  Tags,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full text-center">
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
          <div className="absolute inset-0 bg-indigo-50 rounded-full flex items-center justify-center">
            <ShieldAlert
              className="w-14 h-14 text-indigo-600"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track to your workspace.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Helpful Links Grid */}
        <div className="border-t border-gray-200 pt-12">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
            Helpful Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/data-sources"
              className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <Database className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Data Sources</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mt-auto">
                View and manage your connected enterprise data catalogs.
              </p>
            </Link>

            <Link
              href="/compliance"
              className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Compliance</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mt-auto">
                Monitor global privacy boundaries and assess AI risks.
              </p>
            </Link>

            <Link
              href="/tags"
              className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <Tags className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Global Tags</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mt-auto">
                Manage your classification taxonomy and strict retention labels.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
